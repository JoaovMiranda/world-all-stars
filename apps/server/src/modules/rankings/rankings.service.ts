// Rankings (handoff v3 §8, E01–E05): evidence is read from the universal model, the pure @was/ranking engine
// calculates, and the result is stored as an immutable candidate snapshot. Publication needs two DIFFERENT admins
// (same rule as the Hall dossiers); a published snapshot never changes (DB trigger) — a recalculation is a new one.
import {
  type Actor, type Database, active, athletes, competitors, rankingCalculationRuns, rankingEntries, rankingEntryItems, rankingEntryMetrics, rankingMethodologies, rankingRulesets,
  rankingSnapshotApprovals, rankingSnapshots, seedId, teams,
} from '@was/db';
import { METHODOLOGIES, type RankingEvidence, type RankingInput, runRanking, sha256 } from '@was/ranking';
import { AdminAuditAction, type RankingDetailResponse, type RankingsListResponse, type RankingSnapshotSummary, uuidv7 } from '@was/shared';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import type { AppDeps } from '../../http/app-context.type';
import { forbidden, notFound } from '../../http/http-error.error';

type Row = Record<string, unknown>;
const rows = async (db: Database, q: ReturnType<typeof sql>) => ((await db.execute(q)) as unknown as { rows: Row[] }).rows;

/** Football evidence: memberships of champion squads (entry with rank 1) of the four tournaments (F01). */
const footballEvidence = async (db: Database): Promise<RankingEvidence[]> =>
  (await rows(db, sql`
    select m.id, m.version, m.person_id, c.slug competition, ed.year, reg.slug registration, m.verification, app.slug appearance
    from entry_members m
    join competition_entries e on e.id = m.entry_id
    join competition_results r on r.entry_id = e.id and r.rank = 1 and r.deleted_at is null
    join competition_editions ed on ed.id = e.edition_id
    join competitions c on c.id = ed.competition_id
    join domain_values reg on reg.id = m.registration_status_id
    join domain_values app on app.id = m.appearance_id
    where m.deleted_at is null and c.slug in ('fifa-world-cup', 'fifa-womens-world-cup', 'olympic-football', 'olympic-football-women')`)).map((r) => ({
    id: String(r.id), version: Number(r.version), kind: 'squad_membership', competitorId: String(r.person_id),
    attributes: { competition: String(r.competition), year: Number(r.year), registration: String(r.registration), verification: String(r.verification), appeared: r.appearance === 'appeared' ? true : r.appearance === 'did_not_appear' ? false : null },
  }));

/** BJJ evidence: individual results of ADCC/IBJJF with the category set (belt, gi, gender, division). */
const bjjEvidence = async (db: Database): Promise<RankingEvidence[]> =>
  (await rows(db, sql`
    select r.id, r.version, e.competitor_id, c.slug competition, ed.year, r.rank placement, cs.label division,
      coalesce((select fp.review_status::text from field_provenance fp where fp.entity_id = r.id and fp.deleted_at is null order by fp.created_at desc limit 1), 'auto_accepted') review,
      max(case when d.slug = 'gi_mode' then v.slug end) gi, max(case when d.slug = 'sex_category' then v.slug end) gender, max(case when d.slug = 'belt' then v.slug end) belt
    from competition_results r
    join competition_entries e on e.id = r.entry_id
    join competition_events ev on ev.id = r.scope_id
    join competition_editions ed on ed.id = ev.edition_id
    join competitions c on c.id = ed.competition_id
    left join category_sets cs on cs.id = ev.category_set_id
    left join category_set_values sv on sv.set_id = cs.id
    left join category_values v on v.id = sv.value_id
    left join category_dimensions d on d.id = v.dimension_id
    where r.deleted_at is null and r.scope = 'event' and c.slug in ('adcc', 'ibjjf-world-championship')
    group by r.id, r.version, e.competitor_id, c.slug, ed.year, r.rank, cs.label`)).map((r) => ({
    id: String(r.id), version: Number(r.version), kind: 'result', competitorId: String(r.competitor_id),
    attributes: {
      competition: String(r.competition), year: Number(r.year), placement: Number(r.placement), division: String(r.division ?? ''), tier: 'world',
      giMode: String(r.gi ?? ''), gender: String(r.gender ?? ''), belt: r.belt ? String(r.belt) : r.gi === 'no-gi' ? null : 'black',
      // Wikipedia tables are provisional until an admin approves the sample (handoff v3 Fase 10).
      verification: r.review === 'approved' ? 'verified' : 'provisional', status: 'official',
    },
  }));

const EVIDENCE: Record<string, (db: Database) => Promise<RankingEvidence[]>> = { 'football-champions': footballEvidence, 'bjj-career': bjjEvidence };

const competitorsOf = async (db: Database, ids: string[]) => {
  if (!ids.length) return [];
  const people = await db.select({ id: athletes.id, name: athletes.knownAs }).from(athletes).where(inArray(athletes.id, ids));
  return people.map((p) => ({ id: p.id, name: p.name, kind: 'person' as const }));
};

/** Calculates every ranking of a methodology and stores CANDIDATE snapshots (status calculated). */
export const calculateRankings = async (deps: AppDeps, methodologyKey: string, actor: Actor) => {
  const methodology = METHODOLOGIES[methodologyKey];
  const loadEvidence = EVIDENCE[methodologyKey];
  if (!methodology || !loadEvidence) throw notFound();
  const db = deps.db;
  const evidence = await loadEvidence(db);
  const input: RankingInput = { evidence, competitors: await competitorsOf(db, [...new Set(evidence.map((e) => e.competitorId))]) };
  const config = methodology.defaultConfig;
  const methodologyId = seedId('ranking_methodology', methodology.key);
  await db.insert(rankingMethodologies).values({ id: methodologyId, createdVia: 'system:ranking', key: methodology.key, outputKind: methodology.outputKind, name: methodology.key }).onConflictDoNothing();
  const rulesetId = seedId('ranking_ruleset', methodology.key, methodology.version, sha256(config));
  await db.insert(rankingRulesets).values({ id: rulesetId, createdVia: 'system:ranking', methodologyId, version: methodology.version, config: config as Record<string, unknown>, configHash: sha256(config), activatedAt: new Date() }).onConflictDoNothing();
  const created: string[] = [];
  for (const def of methodology.rankings(config)) {
    const result = runRanking(methodology, def.key, input, config);
    const rankingKey = `${methodology.key}:${def.key}`;
    await db.transaction(async (tx) => {
      const runId = uuidv7();
      await tx.insert(rankingCalculationRuns).values({
        id: runId, createdVia: 'system:ranking', methodologyId, rulesetId, algorithmVersion: result.engineVersion, methodologyVersion: result.methodologyVersion, rankingKey,
        scope: def.scope, params: {}, inputManifest: result.manifest, inputHash: result.inputHash, outputHash: result.outputHash, status: 'success', startedAt: new Date(), finishedAt: new Date(),
      });
      const snapshotId = uuidv7();
      await tx.insert(rankingSnapshots).values({ id: snapshotId, createdVia: 'system:ranking', runId, rankingKey, title: def.title, status: 'calculated', inputHash: result.inputHash, outputHash: result.outputHash });
      for (const e of result.entries) {
        const entryId = uuidv7();
        await tx.insert(rankingEntries).values({ id: entryId, createdVia: 'system:ranking', snapshotId, competitorId: e.competitorId, rank: e.rank, rankTied: e.rankTied, band: e.band, score: e.score, eligible: e.eligible, eligibilityReason: e.eligibilityReason });
        const metrics = Object.entries(e.metrics);
        if (metrics.length) await tx.insert(rankingEntryMetrics).values(metrics.map(([metric, value]) => ({ id: uuidv7(), createdVia: 'system:ranking', entryId, metric, value })));
        if (e.items.length) await tx.insert(rankingEntryItems).values(e.items.map((i) => ({ id: uuidv7(), createdVia: 'system:ranking', entryId, evidenceType: methodologyKey === 'bjj-career' ? 'competition_results' : 'entry_members', evidenceId: i.evidenceId, contribution: i.contribution, note: i.note })));
      }
      created.push(snapshotId);
    });
  }
  await deps.repo.audit(actor, AdminAuditAction.RankingCalculated, { type: 'ranking_snapshots', id: created[0] ?? methodologyId }, { target: methodologyKey, reason: null });
  return created;
};

/** One approval by an admin; the second approval by a DIFFERENT admin publishes (and archives the previous one). */
export const approveSnapshot = async (deps: AppDeps, snapshotId: string, actor: Actor, reason: string) => {
  const [snap] = await deps.db.select().from(rankingSnapshots).where(active(rankingSnapshots, eq(rankingSnapshots.id, snapshotId)));
  if (!snap) throw notFound();
  if (snap.status !== 'calculated' || !actor.userId) throw forbidden();
  const inserted = await deps.db.insert(rankingSnapshotApprovals).values({ id: uuidv7(), createdVia: 'user', snapshotId, adminUserId: actor.userId, reason }).onConflictDoNothing().returning();
  if (!inserted.length) return { ok: true as const, published: false };
  const approvals = (await deps.db.select().from(rankingSnapshotApprovals).where(active(rankingSnapshotApprovals, eq(rankingSnapshotApprovals.snapshotId, snapshotId)))).length;
  await deps.db.update(rankingSnapshots).set({ approvalsCount: approvals }).where(eq(rankingSnapshots.id, snapshotId));
  await deps.repo.audit(actor, AdminAuditAction.RankingApproved, { type: 'ranking_snapshots', id: snapshotId }, { target: snap.title, reason });
  if (approvals < snap.approvalsRequired) return { ok: true as const, published: false };
  await deps.db.transaction(async (tx) => {
    await tx.update(rankingSnapshots).set({ status: 'archived' }).where(and(eq(rankingSnapshots.rankingKey, snap.rankingKey), eq(rankingSnapshots.status, 'published')));
    await tx.update(rankingSnapshots).set({ status: 'published', publishedAt: new Date() }).where(eq(rankingSnapshots.id, snapshotId));
  });
  await deps.repo.audit(actor, AdminAuditAction.RankingPublished, { type: 'ranking_snapshots', id: snapshotId }, { target: snap.title, reason });
  return { ok: true as const, published: true };
};

const summaries = async (db: Database, where: ReturnType<typeof sql>): Promise<RankingSnapshotSummary[]> =>
  (await rows(db, sql`
    select s.*, r.methodology_version, m.key methodology, m.output_kind, sp.slug sport, (select count(*)::int from ranking_entries e where e.snapshot_id = s.id) n
    from ranking_snapshots s join ranking_calculation_runs r on r.id = s.run_id join ranking_methodologies m on m.id = r.methodology_id left join sports sp on sp.id = m.sport_id
    where s.deleted_at is null and ${where} order by s.ranking_key, s.created_at desc`)).map((s) => ({
    id: String(s.id), rankingKey: String(s.ranking_key), methodology: String(s.methodology), methodologyVersion: String(s.methodology_version),
    sport: s.methodology === 'football-champions' ? 'football' : s.methodology === 'bjj-career' ? 'jiu-jitsu' : (s.sport as string | null) ?? null,
    title: String(s.title), outputKind: s.output_kind as RankingSnapshotSummary['outputKind'], status: s.status as RankingSnapshotSummary['status'], entries: Number(s.n),
    inputHash: String(s.input_hash), outputHash: String(s.output_hash), approvals: Number(s.approvals_count), approvalsRequired: Number(s.approvals_required),
    calculatedAt: new Date(String(s.created_at)).toISOString(), publishedAt: s.published_at ? new Date(String(s.published_at)).toISOString() : null,
  }));

export const listPublished = async (db: Database): Promise<RankingsListResponse> => ({ items: await summaries(db, sql`s.status = 'published'`) });
export const listAll = async (db: Database): Promise<RankingsListResponse> => ({ items: await summaries(db, sql`true`) });

export const rankingDetail = async (db: Database, id: string, page: number, pageSize: number, publishedOnly = true): Promise<RankingDetailResponse> => {
  const [snapshot] = await summaries(db, sql`s.id = ${id} and ${publishedOnly ? sql`s.status in ('published', 'archived')` : sql`true`}`);
  if (!snapshot) throw notFound();
  const entries = await db.select().from(rankingEntries).where(eq(rankingEntries.snapshotId, id)).orderBy(sql`${rankingEntries.rank} asc nulls last`, rankingEntries.competitorId);
  const slice = entries.slice((page - 1) * pageSize, page * pageSize);
  const ids = slice.map((e) => e.id);
  const metrics = ids.length ? await db.select().from(rankingEntryMetrics).where(inArray(rankingEntryMetrics.entryId, ids)) : [];
  const people = slice.length ? await db.select({ id: athletes.id, name: athletes.knownAs, slug: athletes.slug, visibility: competitors.profileVisibility }).from(athletes).innerJoin(competitors, eq(competitors.id, athletes.id)).where(inArray(athletes.id, slice.map((e) => e.competitorId))) : [];
  const team = slice.length ? await db.select({ id: teams.id, name: teams.name }).from(teams).where(inArray(teams.id, slice.map((e) => e.competitorId))) : [];
  type Who = { id: string; name: string; slug: string | null; kind: string; hasProfile: boolean };
  const who = new Map<string, Who>([
    ...people.map((p): [string, Who] => [p.id, { id: p.id, name: p.name, slug: p.slug, kind: 'person', hasProfile: p.visibility === 'public' }]),
    ...team.map((t): [string, Who] => [t.id, { id: t.id, name: t.name, slug: null, kind: 'team', hasProfile: false }]),
  ]);
  return {
    snapshot, total: entries.length, page, pageSize,
    entries: slice.map((e) => ({
      rank: e.rank, rankTied: e.rankTied, score: e.score, band: e.band, eligible: e.eligible, eligibilityReason: e.eligibilityReason,
      competitor: who.get(e.competitorId) ?? { id: e.competitorId, name: '?', slug: null, kind: 'person', hasProfile: false },
      metrics: Object.fromEntries(metrics.filter((m) => m.entryId === e.id).map((m) => [m.metric, m.value ?? 0])),
    })),
  };
};

export const athleteRankings = async (db: Database, slug: string) => {
  const [a] = await db.select().from(athletes).where(active(athletes, eq(athletes.slug, slug)));
  if (!a) throw notFound();
  const list = await db
    .select({ snapshotId: rankingSnapshots.id, title: rankingSnapshots.title, rank: rankingEntries.rank, rankTied: rankingEntries.rankTied, score: rankingEntries.score })
    .from(rankingEntries)
    .innerJoin(rankingSnapshots, eq(rankingSnapshots.id, rankingEntries.snapshotId))
    .where(and(eq(rankingEntries.competitorId, a.id), eq(rankingSnapshots.status, 'published'), eq(rankingEntries.eligible, true)))
    .orderBy(desc(rankingSnapshots.publishedAt));
  return { items: list };
};

export const methodologiesList = () => ({
  items: Object.values(METHODOLOGIES).map((m) => ({ key: m.key, version: m.version, sport: m.sport, outputKind: m.outputKind, rankings: m.rankings(m.defaultConfig as never).map((r) => ({ key: r.key, title: r.title })) })),
});
