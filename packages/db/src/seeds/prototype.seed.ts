// Loads the HTML prototype's simulated database (plan/front-prototype/mock, through the SAME node:vm loader as the
// fixture exporter) and upserts every row into the real schema. Idempotent: natural keys (first unique index of
// each table) or the prototype's deterministic ids. Requires plan/ (gitignored); without it only config is seeded.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { AdminAuditAction, ConsentPurpose, DEMO_SESSION_EMAILS, LEGAL_DOCUMENT_VERSIONS, NotificationKind, REQUIRED_LEGAL_DOCUMENTS } from '@was/shared';
import { eq, getTableColumns, getTableName, isNull, sql } from 'drizzle-orm';
import countryCodes from 'i18n-iso-countries';
import type { PgTable } from 'drizzle-orm/pg-core';

import type { Database } from '../client';
import { seedId } from '../helpers/seed-id.helper';
import { columnKeysByDbName, upsertRow } from '../helpers/upsert.helper';
import * as schema from '../schema';
import { countries } from '../tables/geography.table';
import { fieldConflicts } from '../tables/source.table';

type ProtoRow = Record<string, unknown> & { id: string };
interface ProtoDb {
  tables: Record<string, ProtoRow[]>;
  all(table: string): ProtoRow[];
  get(table: string, id: string | null): ProtoRow | null;
}
interface ProtoSchema {
  tables: Record<string, { fk: Record<string, string> }>;
}
interface Prototype {
  schema: ProtoSchema;
  api: Record<string, (...args: unknown[]) => unknown>;
  db: ProtoDb;
  catalog: {
    governance: Record<string, { name: string; summary: string }>;
    orgKinds: Record<string, [string, string]>;
    prizeForms: Record<string, string>;
  };
  collectionRuns: Record<string, unknown>[];
  collectedSports: { sport: string; reason_pt: string; facts: Record<string, unknown>[] }[];
  slugRedirects: { table: string; oldSlug: string; newSlug: string; id: string }[];
}

export interface SeedReport {
  tables: Record<string, number>;
  skipped?: string;
}

const LOCALE = 'pt-BR';
/** Locales of content-translations.json written by the seed (pt-BR comes from the mock rows). */
const CONTENT_LOCALES = ['en', 'es'] as const;
/** Translation table → FK column of its parent (same map as scripts/translations/content-translations.mjs). */
const CONTENT_FK: Record<string, string> = {
  athlete_translations: 'athlete_id', athlete_milestone_translations: 'milestone_id', sport_translations: 'sport_id', sport_group_translations: 'group_id',
  sport_subgroup_translations: 'subgroup_id', sport_category_translations: 'category_id', country_translations: 'country_id', city_translations: 'city_id',
  competition_translations: 'competition_id', award_translations: 'award_id', observance_day_translations: 'observance_day_id',
  greats_dossier_translations: 'dossier_id', greats_evidence_translations: 'evidence_id', governance_model_translations: 'governance_model_id',
  organization_kind_translations: 'organization_kind_id', prize_form_translations: 'prize_form_id',
};
const SIGNED_UP_AT = '2026-10-01T12:00:00.000Z';
const SEED_CURATORS = [
  { email: 'curador1@exemplo.invalid', name: 'Curador 1 (seed)' },
  { email: 'curador2@exemplo.invalid', name: 'Curador 2 (seed)' },
];

const tablesByName = (): Map<string, PgTable> => {
  const out = new Map<string, PgTable>();
  for (const value of Object.values(schema)) {
    if (value && typeof value === 'object' && Symbol.for('drizzle:IsDrizzleTable') in value) out.set(getTableName(value as PgTable), value as PgTable);
  }
  return out;
};

/** Parents before children (FK graph of the prototype schema), self-references handled per row. */
const tableOrder = (protoSchema: ProtoSchema): string[] => {
  const order: string[] = [];
  const visit = (name: string, stack: Set<string>) => {
    if (order.includes(name) || stack.has(name)) return;
    stack.add(name);
    for (const parent of Object.values(protoSchema.tables[name]?.fk ?? {})) if (parent !== name) visit(parent, stack);
    order.push(name);
  };
  for (const name of Object.keys(protoSchema.tables)) visit(name, new Set());
  return order;
};

const selfFkColumns = (protoSchema: ProtoSchema, name: string) =>
  Object.entries(protoSchema.tables[name]?.fk ?? {}).filter(([, parent]) => parent === name).map(([col]) => col);

/** Rows ordered so a row comes after the row it references in the same table. */
const parentsFirst = (rows: ProtoRow[], selfCols: string[]): ProtoRow[] => {
  if (!selfCols.length) return rows;
  const byId = new Map(rows.map((r) => [r.id, r]));
  const depth = (r: ProtoRow, seen = new Set<string>()): number => {
    const parentId = selfCols.map((c) => r[c]).find((v): v is string => typeof v === 'string');
    const parent = parentId ? byId.get(parentId) : undefined;
    if (!parent || seen.has(parent.id)) return 0;
    seen.add(parent.id);
    return 1 + depth(parent, seen);
  };
  return [...rows].sort((a, b) => depth(a) - depth(b));
};

const loadPrototype = async (repoRoot: string): Promise<{ proto: Prototype; mockDir: string; mappers: Record<string, (...a: unknown[]) => unknown> } | null> => {
  const mockDir = path.join(repoRoot, 'plan/front-prototype/mock');
  const loaderFile = path.join(repoRoot, 'scripts/fixtures/prototype-loader.mjs');
  if (!fs.existsSync(mockDir) || !fs.existsSync(loaderFile)) return null;
  const { loadPrototype: load } = (await import(pathToFileURL(loaderFile).href)) as { loadPrototype: (dir: string) => Prototype };
  const { runDemoActivity } = (await import(pathToFileURL(path.join(repoRoot, 'scripts/fixtures/prototype-demo-activity.mjs')).href)) as {
    runDemoActivity: (api: unknown, reader: string) => void;
  };
  const mappers = (await import(pathToFileURL(path.join(repoRoot, 'scripts/fixtures/admin-fixture-mappers.mjs')).href)) as Record<string, (...a: unknown[]) => unknown>;
  const proto = load(mockDir);
  runDemoActivity(proto.api, DEMO_SESSION_EMAILS.reader);
  return { proto, mockDir, mappers };
};

export const seedPrototype = async (db: Database, repoRoot: string, log: (msg: string) => void = () => undefined): Promise<SeedReport> => {
  const loaded = await loadPrototype(repoRoot);
  if (!loaded) return { tables: {}, skipped: 'plan/front-prototype not found: only configuration was seeded' };
  const { proto, mockDir, mappers } = loaded;
  const protoSchema = proto.schema;
  const tables = tablesByName();
  const idMap = new Map<string, string>();
  const report: Record<string, number> = {};
  const count = (t: string, n = 1) => (report[t] = (report[t] ?? 0) + n);
  const mapId = (v: unknown) => (typeof v === 'string' && idMap.has(v) ? idMap.get(v) : v);

  const put = async (name: string, values: Record<string, unknown>, protoId?: string) => {
    const table = tables.get(name);
    if (!table) throw new Error(`Seed: table ${name} is not in the Drizzle schema`);
    const id = await upsertRow(db, table, values);
    if (protoId) idMap.set(protoId, id);
    count(name);
    return id;
  };

  // 1 · Every prototype table, generically (columns by database name, FKs remapped to the ids in the database).
  for (const name of tableOrder(protoSchema)) {
    const table = tables.get(name);
    if (!table) throw new Error(`Seed: prototype table ${name} has no Drizzle table`);
    const keys = columnKeysByDbName(table);
    const columns = getTableColumns(table);
    for (const row of parentsFirst(proto.db.tables[name] ?? [], selfFkColumns(protoSchema, name))) {
      if (row.deleted_at) continue;
      const values: Record<string, unknown> = {};
      for (const [col, raw] of Object.entries(row)) {
        const key = keys.get(col);
        if (!key) throw new Error(`Seed: column ${name}.${col} is not in the Drizzle schema`);
        if (raw === null || raw === undefined) continue;
        const value = mapId(raw);
        values[key] = columns[key]!.columnType === 'PgTimestamp' && typeof value === 'string' ? new Date(value) : value;
      }
      values.createdVia = 'seed';
      await put(name, values, row.id);
    }
  }
  const P = (id: unknown) => mapId(id) as string;
  const protoUser = (email: string) => proto.db.all('users').find((u) => u.email === email);

  // ISO numeric of each country (globe ids), from ISO 3166 tables.
  for (const c of proto.db.all('countries')) {
    const numeric = countryCodes.alpha2ToNumeric(String(c.iso2));
    if (numeric) await db.update(countries).set({ isoNumeric: numeric }).where(eq(countries.id, P(c.id)));
  }

  // 2 · Catalog labels as translations (governance models, organization kinds, prize forms).
  for (const g of proto.db.all('governance_models')) {
    const info = proto.catalog.governance[g.slug as string];
    if (info) await put('governance_model_translations', { id: seedId('gm_tr', g.slug as string, LOCALE), createdVia: 'seed', governanceModelId: P(g.id), locale: LOCALE, name: info.name, summary: info.summary });
  }
  for (const k of proto.db.all('organization_kinds')) {
    const info = proto.catalog.orgKinds[k.slug as string];
    if (info) await put('organization_kind_translations', { id: seedId('ok_tr', k.slug as string, LOCALE), createdVia: 'seed', organizationKindId: P(k.id), locale: LOCALE, name: info[0] });
  }
  for (const f of proto.db.all('prize_forms')) {
    const label = proto.catalog.prizeForms[f.slug as string];
    if (label) await put('prize_form_translations', { id: seedId('pf_tr', f.slug as string, LOCALE), createdVia: 'seed', prizeFormId: P(f.id), locale: LOCALE, name: label });
  }

  // 2b · Content translations (handoff v3 §11): English base + Spanish from content-translations.json. Keys are the
  // PARENT ids of the prototype (athlete, sport, competition…); the pt-BR rows came with the mock in step 1.
  const contentFile = path.join(repoRoot, 'packages/db/src/seeds/content-translations.json');
  if (fs.existsSync(contentFile)) {
    const content = JSON.parse(fs.readFileSync(contentFile, 'utf8')) as { tables: Record<string, Record<string, Record<string, unknown>>> };
    for (const [name, entries] of Object.entries(content.tables)) {
      const fk = CONTENT_FK[name];
      const table = tables.get(name);
      if (!fk || !table) continue;
      const keys = columnKeysByDbName(table);
      for (const [parentProtoId, entry] of Object.entries(entries)) {
        const parentId = idMap.get(parentProtoId);
        if (!parentId) continue;
        const source = (entry['pt-BR'] as Record<string, string | null> | undefined) ?? {};
        for (const locale of CONTENT_LOCALES) {
          const translated = (entry[locale] as Record<string, string | null> | undefined) ?? {};
          if (!Object.values(translated).some(Boolean)) continue;
          const values: Record<string, unknown> = { id: seedId('ct', name, parentProtoId, locale), createdVia: 'seed', [keys.get(fk)!]: parentId, locale };
          // A field not translated in this locale keeps the pt-BR text (NOT NULL columns); the mapper falls back anyway.
          for (const [col, v] of Object.entries(source)) if (v) values[keys.get(col)!] = translated[col] ?? v;
          await put(name, values);
        }
      }
    }
  }

  // 2c · Old Portuguese slugs → 301 (registry entities only: sports, competitions, organizations, teams).
  const REDIRECT_TYPES: Record<string, string> = { sports: 'sport', competitions: 'competition', organizations: 'organization', teams: 'competitor' };
  for (const r of proto.slugRedirects) {
    const entityType = REDIRECT_TYPES[r.table];
    if (entityType) await put('slug_redirects', { id: seedId('slug', r.table, r.oldSlug), createdVia: 'seed', entityType, entityId: P(r.id), oldSlug: r.oldSlug, scope: r.table === 'teams' ? 'teams' : '' });
  }

  // 3 · Collection reports of sports without athletes (doc 18) and AI collection runs (docs 11/18).
  for (const r of proto.collectedSports) {
    const sport = proto.db.all('sports').find((s) => s.slug === r.sport);
    if (sport) await put('sport_collection_reports', { id: seedId('scr', r.sport), createdVia: 'seed', sportId: P(sport.id), reason: r.reason_pt, facts: r.facts });
  }
  for (const r of proto.collectionRuns) {
    await put('ai_collection_runs', {
      id: seedId('acr', String(r.started_at)),
      createdVia: 'seed',
      startedAt: new Date(String(r.started_at)),
      mode: r.mode,
      checked: r.checked,
      unchanged: r.unchanged,
      validated: r.validated,
      factsAccepted: r.facts_ok,
      factsRejected: r.facts_rejected,
      extractorTokens: r.extractor_tokens,
    });
  }

  // 4 · Ingestion logs (same lines the admin fixtures show) and conflict bases.
  const logsOf = mappers.logsOf as (run: Record<string, unknown>) => { at: string; level: string; message: string }[];
  for (const r of proto.db.all('ingestion_runs')) {
    const lines = logsOf({ startedAt: r.started_at, checked: r.checked, mode: r.mode, unchanged: r.unchanged, updated: r.updated, errors: r.errors, tokens: 0 });
    for (const [i, line] of lines.entries()) {
      await put('ingestion_logs', { id: seedId('il', r.id, i), createdVia: 'seed', runId: P(r.id), level: line.level, message: line.message, at: new Date(line.at) });
    }
  }
  // The 3-way diff base of a seeded conflict is the value chosen when it was opened.
  await db.update(fieldConflicts).set({ baseValue: sql`${fieldConflicts.chosenValue}` }).where(isNull(fieldConflicts.baseValue));

  // 5 · Curators (seed admins) and the approvals of the dossiers; demo "awaiting 2nd approval" dossiers.
  const curatorIds: string[] = [];
  for (const c of SEED_CURATORS) curatorIds.push(await put('users', { id: seedId('user', c.email), createdVia: 'seed', email: c.email, displayName: c.name, role: 'admin' }));
  for (const d of proto.db.all('greats_dossiers')) {
    for (let i = 0; i < Number(d.approvals_count ?? 0) && i < curatorIds.length; i++) {
      await put('greats_dossier_approvals', { id: seedId('gda', d.id, i), createdVia: 'seed', dossierId: P(d.id), adminUserId: curatorIds[i] });
    }
  }
  const demoDossiers = (mappers.demoPendingDossiers as (db: ProtoDb, dir: string) => {
    slug: string; athleteId: string; headline: string; approvals: number; note: string | null; evidences: { type: string; description: string; sourceLinkId: string }[];
  }[])(proto.db, mockDir);
  for (const d of demoDossiers) {
    const dossierId = await put('greats_dossiers', { id: seedId('gd', d.slug), createdVia: 'seed', athleteId: P(d.athleteId), status: 'pending', approvalsRequired: 2, approvalsCount: d.approvals, reviewNote: d.note });
    await put('greats_dossier_translations', { id: seedId('gd_tr', d.slug), createdVia: 'seed', dossierId, locale: LOCALE, headline: d.headline });
    for (let i = 0; i < d.approvals && i < curatorIds.length; i++) await put('greats_dossier_approvals', { id: seedId('gda', d.slug, i), createdVia: 'seed', dossierId, adminUserId: curatorIds[i] });
    for (const [i, e] of d.evidences.entries()) {
      const evidenceId = await put('greats_evidences', { id: seedId('ge', d.slug, i), createdVia: 'seed', dossierId, evidenceType: e.type, sourceLinkId: P(e.sourceLinkId) });
      await put('greats_evidence_translations', { id: seedId('ge_tr', d.slug, i), createdVia: 'seed', evidenceId, locale: LOCALE, description: e.description });
    }
  }

  // 6 · Notifications: replies by others to a user's comment (E4).
  for (const c of proto.db.all('comments')) {
    const parent = c.parent_comment_id ? proto.db.get('comments', c.parent_comment_id as string) : null;
    if (!parent || parent.user_id === c.user_id) continue;
    await put('notifications', {
      id: seedId('notification', c.id),
      createdVia: 'seed',
      createdAt: new Date(String(c.created_at)),
      userId: P(parent.user_id),
      kind: NotificationKind.CommentReply,
      entityType: 'comments',
      entityId: P(c.id),
      actorId: P(c.user_id),
      payload: { excerpt: String(c.body).slice(0, 140), athleteId: P(c.athlete_id), commentId: P(c.id) },
    });
  }

  // 7 · Sign-up of the demo accounts: the CURRENT Terms + Privacy accepted (no demo account is left pending), notification
  // e-mails opted in (doc 13). One row per version (the id includes it): re-seeding an existing database after
  // LEGAL_DOCUMENT_VERSIONS changes adds the new acceptance and keeps the old one as history.
  for (const email of Object.values(DEMO_SESSION_EMAILS)) {
    const user = protoUser(email);
    if (!user) continue;
    for (const kind of REQUIRED_LEGAL_DOCUMENTS) {
      const { version } = LEGAL_DOCUMENT_VERSIONS[kind];
      await put('legal_acceptances', { id: seedId('la', email, kind, version), createdVia: 'seed', userId: P(user.id), documentKind: kind, documentVersion: version, acceptedAt: new Date(SIGNED_UP_AT) });
    }
    await put('user_consents', { id: seedId('uc', email), createdVia: 'seed', userId: P(user.id), purpose: ConsentPurpose.NotificationEmails, granted: true, decidedAt: new Date(SIGNED_UP_AT) });
  }

  // 8 · Admin audit: tier history (A4) and the demo privacy requests (A5) of the fixtures.
  const admin = protoUser(DEMO_SESSION_EMAILS.admin);
  for (const h of proto.db.all('athlete_tier_history')) {
    await put('audit_logs', {
      id: seedId('audit', h.id),
      createdVia: 'seed',
      createdAt: new Date(`${String(h.decided_at)}T00:00:00.000Z`),
      actorId: admin ? P(admin.id) : null,
      actorType: 'user',
      action: AdminAuditAction.TierChanged,
      entityType: 'athletes',
      entityId: P(h.athlete_id),
      metadata: { actorName: admin?.display_name ?? 'admin', target: proto.db.get('athletes', h.athlete_id as string)?.known_as, reason: h.reason ?? null },
    });
  }
  const athleteRef = (id: string) => ({ id });
  const privacy = (mappers.demoPrivacyRequests as (ref: typeof athleteRef, db: ProtoDb) => { items: Record<string, unknown>[] })(athleteRef, proto.db);
  for (const r of privacy.items) {
    await put('privacy_requests', {
      id: seedId('privacy', String(r.protocol)),
      createdVia: 'seed',
      createdAt: new Date(String(r.createdAt)),
      protocol: r.protocol,
      requesterEmail: r.requesterEmail,
      subjectKind: r.subjectKind,
      right: r.right,
      athleteId: r.athlete ? P((r.athlete as { id: string }).id) : null,
      details: r.details,
      status: r.status,
      dueAt: new Date(String(r.dueAt)),
      answeredAt: r.answeredAt ? new Date(String(r.answeredAt)) : null,
      handledBy: r.handledBy && curatorIds[0] ? curatorIds[0] : null,
      note: r.note,
    });
  }
  log(`prototype: ${Object.values(report).reduce((s, n) => s + n, 0)} rows in ${Object.keys(report).length} tables`);
  return { tables: report };
};

