// Sports catalog (handoff v3 §11.5): every sport/discipline of data/catalog/sports.catalog.json becomes ONE sport
// (own card on /sports), with en/pt-BR/es names, the sport → discipline graph, multi-sport programmes as data
// (competition_program_sports) and Wikidata ids. Existing sports are reconciled by slug, never duplicated: their
// curated texts, colours and stats schema are kept. Idempotent.
import fs from 'node:fs';
import path from 'node:path';

import { DomainKind } from '@was/shared';
import { eq } from 'drizzle-orm';

import type { Database } from '../client';
import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import * as T from '../schema';

interface CatalogSport {
  slug: string;
  subgroup: string;
  format: string;
  environment: string;
  parent: string | null;
  wikidataQid: string | null;
  wikipediaUrl: string | null;
  names: Record<'en' | 'pt-BR' | 'es', string | null>;
  programmes: { event: string; status: string; years: number[] }[];
  aliases: { name: string; kind: string }[];
}
interface Catalog {
  subgroups: [slug: string, group: string, en: string, pt: string, es: string][];
  events: Record<string, [slug: string, org: string, en: string, pt: string, es: string]>;
  organizations: Record<string, string>;
  sports: CatalogSport[];
}

/** Card colour of a new sport by navigation subgroup (existing sports keep their own). */
const COLOR_BY_SUBGROUP: Record<string, string> = {
  'team-sports': '--success', aquatics: '--info', combat: '--danger', precision: '--c-teal', racket: '--c-lime', strength: '--c-orange', nautical: '--c-teal',
  extreme: '--c-teal', 'board-games': '--primary', 'card-games': '--primary', winter: '--info', 'athletics-endurance': '--accent', 'gymnastics-artistic': '--c-pink',
  wheels: '--c-orange', equestrian: '--c-lime', traditional: '--c-lime',
};
const LOCALES = ['en', 'pt-BR', 'es'] as const;
const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export const catalogFile = (repoRoot: string) => path.join(repoRoot, 'data/catalog/sports.catalog.json');

export const seedSportsCatalog = async (db: Database, repoRoot: string): Promise<{ sports: number; programmes: number } | null> => {
  const file = catalogFile(repoRoot);
  if (!fs.existsSync(file)) return null;
  const catalog = JSON.parse(fs.readFileSync(file, 'utf8')) as Catalog;
  const put = (table: Parameters<typeof upsertRow>[1], values: Record<string, unknown>) => upsertRow(db, table, { createdVia: 'seed', ...values });
  const domainRows = await db.select().from(T.domainValues);
  const domainId = async (domain: DomainKind, slug: string) => domainRows.find((d) => d.domain === domain && d.slug === slug && !d.deletedAt)?.id;

  // Navigation subgroups.
  const groups = new Map((await db.select().from(T.sportGroups)).map((g) => [g.slug, g.id]));
  const subgroups = new Map((await db.select().from(T.sportSubgroups)).map((g) => [g.slug, g.id]));
  for (const [i, [slug, group, en, pt, es]] of catalog.subgroups.entries()) {
    const groupId = groups.get(group);
    if (!groupId) continue;
    const id = await put(T.sportSubgroups, { id: seedId('subgroup', slug), groupId, slug, sortOrder: 100 + i });
    subgroups.set(slug, id);
    for (const [locale, name] of [['en', en], ['pt-BR', pt], ['es', es]] as const) await put(T.sportSubgroupTranslations, { id: seedId('subgroup_tr', slug, locale), subgroupId: id, locale, name });
  }

  // Multi-sport organizations and events (programme owners).
  const level = async (slug: string) => (await db.select().from(T.competitionLevels)).find((l) => l.slug === slug)!.id;
  const worldLevel = await level('world');
  const committeeKind = (await db.select().from(T.organizationKinds)).find((k) => k.slug === 'multisport_committee')!.id;
  const orgs = new Map((await db.select().from(T.organizations)).map((o) => [o.slug, o.id]));
  for (const [slug, name] of Object.entries(catalog.organizations)) {
    if (!orgs.has(slug)) orgs.set(slug, await put(T.organizations, { id: seedId('org', slug), slug, name, organizationKindId: committeeKind, scopeLevelId: worldLevel }));
  }
  const events = new Map<string, string>();
  for (const [code, [slug, org, en, pt, es]] of Object.entries(catalog.events)) {
    const id = await put(T.competitions, { id: seedId('competition', slug), slug, organizationId: orgs.get(org), competitionLevelId: worldLevel, isOlympic: org === 'ioc', isMultiSport: true });
    events.set(code, id);
    for (const [locale, name] of [['en', en], ['pt-BR', pt], ['es', es]] as const) await put(T.competitionTranslations, { id: seedId('competition_tr', slug, locale), competitionId: id, locale, name });
  }

  // Sports: new ones created, existing ones enriched (QID/URL only when missing).
  const sportTaxon = await domainId(DomainKind.TaxonLevel, 'sport');
  const disciplineTaxon = await domainId(DomainKind.TaxonLevel, 'discipline');
  const existing = new Map((await db.select().from(T.sports)).filter((s) => !s.deletedAt).map((s) => [s.slug, s]));
  const sportIds = new Map<string, string>();
  for (const s of catalog.sports) {
    const old = existing.get(s.slug);
    const taxonLevelId = s.parent ? disciplineTaxon : sportTaxon;
    const id = old
      ? (await db.update(T.sports).set({ wikidataQid: old.wikidataQid ?? s.wikidataQid, wikipediaUrl: old.wikipediaUrl?.includes('search=') || !old.wikipediaUrl ? s.wikipediaUrl : old.wikipediaUrl, taxonLevelId }).where(eq(T.sports.id, old.id)), old.id)
      : await put(T.sports, {
          id: seedId('sport', s.slug), slug: s.slug, subgroupId: subgroups.get(s.subgroup), wikidataQid: s.wikidataQid, wikipediaUrl: s.wikipediaUrl,
          isTeamSport: s.format === 'team', statsSchemaKey: 'generic', colorToken: COLOR_BY_SUBGROUP[s.subgroup] ?? '--primary', environment: s.environment, format: s.format, taxonLevelId,
        });
    sportIds.set(s.slug, id);
    if (!old) {
      for (const locale of LOCALES) {
        const name = s.names[locale] ?? s.names.en;
        if (name) await put(T.sportTranslations, { id: seedId('sport_tr', s.slug, locale), sportId: id, locale, name });
      }
    }
    if (s.wikidataQid) await put(T.entityExternalIds, { id: seedId('xid', 'wikidata', s.wikidataQid), entityId: id, provider: 'wikidata', externalId: s.wikidataQid, url: `https://www.wikidata.org/wiki/${s.wikidataQid}` });
    if (s.wikipediaUrl) await put(T.entityExternalIds, { id: seedId('xid', 'wikipedia_en', s.slug), entityId: id, provider: 'wikipedia_en', externalId: decodeURIComponent(s.wikipediaUrl.split('/wiki/')[1] ?? s.slug), url: s.wikipediaUrl });
    for (const a of s.aliases) {
      const kindId = await domainId(DomainKind.NameKind, a.kind);
      if (kindId) await put(T.entityAliases, { id: seedId('alias', id, a.kind, a.name), entityId: id, name: a.name, normalized: normalize(a.name), kindId });
    }
  }

  // Sport → discipline graph and programmes.
  const disciplineOf = await domainId(DomainKind.SportRelation, 'discipline_of');
  let programmes = 0;
  for (const s of catalog.sports) {
    const id = sportIds.get(s.slug)!;
    if (s.parent && sportIds.get(s.parent)) await put(T.sportRelations, { id: seedId('sportrel', s.slug, s.parent), fromSportId: id, toSportId: sportIds.get(s.parent), relationId: disciplineOf });
    for (const p of s.programmes) {
      const competitionId = events.get(p.event);
      const statusId = await domainId(DomainKind.InclusionStatus, p.status);
      if (!competitionId || !statusId) continue;
      await put(T.competitionProgramSports, {
        id: seedId('programme', p.event, s.slug, p.status), competitionId, sportId: id, inclusionStatusId: statusId,
        firstYear: p.years.length ? Math.min(...p.years) : null, lastYear: p.years.length ? Math.max(...p.years) : null, editions: p.years,
      });
      programmes++;
    }
  }
  return { sports: catalog.sports.length, programmes };
};
