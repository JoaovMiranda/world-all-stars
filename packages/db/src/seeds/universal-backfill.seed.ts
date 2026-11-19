// Legacy → universal model (handoff v3 §4, §13). Idempotent (deterministic ids + natural keys): reads the legacy tables
// (achievements, awards, title_reigns, athlete_nationalities, athlete_teams, sport_governing_bodies, sport_categories,
// athlete_stats, nicknames/external ids) and writes the competitor-first model. Legacy tables stay until 0014.
import { DomainKind, normalizeForSearch } from '@was/shared';
import { eq, getTableName } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import type { Database } from '../client';
import { seedId } from '../helpers/seed-id.helper';
import { upsertRow } from '../helpers/upsert.helper';
import * as T from '../schema';

type Row = Record<string, unknown> & { id: string };
const all = async (db: Database, table: PgTable) => (await db.select().from(table)).filter((r) => !(r as Row).deletedAt) as Row[];

/** Legacy sport_categories → dimension values (the mock mixed sex, distance, style, weight and game modes in one level). */
const CATEGORY_VALUES: Record<string, [dimension: string, value: string][]> = {
  'football-men': [['sex_category', 'men']],
  'swimming-butterfly': [['style', 'butterfly']], 'swimming-100-butterfly': [['style', 'butterfly'], ['distance', '100m']], 'swimming-200-butterfly': [['style', 'butterfly'], ['distance', '200m']],
  'swimming-medley': [['style', 'individual-medley']], 'swimming-200-medley': [['style', 'individual-medley'], ['distance', '200m']], 'swimming-400-medley': [['style', 'individual-medley'], ['distance', '400m']],
  'swimming-relay': [['style', 'relay']], 'swimming-4x200-freestyle': [['style', 'freestyle'], ['distance', '4x200m']], 'swimming-4x100-medley': [['style', 'medley-relay'], ['distance', '4x100m']],
  'swimming-freestyle': [['style', 'freestyle']], 'swimming-200-freestyle': [['style', 'freestyle'], ['distance', '200m']], 'swimming-4x100-freestyle': [['style', 'freestyle'], ['distance', '4x100m']],
  'boxing-heavyweight': [['weight', 'heavyweight']], 'cs-csgo': [['game_version', 'cs-go']], 'mma-middleweight': [['weight', 'middleweight']],
  'vela-finn': [['boat_class', 'finn']], 'vela-laser': [['boat_class', 'laser']], 'lol-5v5': [['game_mode', '5v5']],
  'high-diving-men': [['sex_category', 'men'], ['distance', '27m']], 'sumo-makuuchi': [['division', 'makuuchi']],
  'arm-wrestling-super-heavyweight': [['weight', 'super-heavyweight'], ['arm', 'right']],
  'chess-classical': [['time_control', 'classical']], 'chess-rapid': [['time_control', 'rapid']], 'chess-blitz': [['time_control', 'blitz']],
  'tennis-men-singles': [['sex_category', 'men'], ['entry_format', 'singles']], 'bjj-black-belt': [['belt', 'black'], ['age', 'adult']],
  'bodybuilding-open': [['division', 'open']], 'muay-thai-professional': [['professional_status', 'professional']],
  'aom-1v1': [['game_mode', '1v1']], 'golf-men': [['sex_category', 'men'], ['professional_status', 'professional']],
};
const ORDINAL_DIMENSIONS = new Set(['belt', 'weight']);

/** Legacy achievement_types → recognition kind + level. */
const ACHIEVEMENT_RECOGNITION: Record<string, [kind: string, level: string | null]> = {
  champion: ['championship_title', 'winner'], title_won: ['championship_title', 'winner'], gold: ['medal', 'gold'], silver: ['medal', 'silver'], bronze: ['medal', 'bronze'],
  runner_up: ['runner_up', 'runner_up'], mvp: ['award', null], award: ['award', null], ranking: ['ranking_honor', null], hall_of_fame: ['hall_of_fame', null],
};
/** Final placing implied by a legacy achievement without rank (champion = 1st, runner-up = 2nd, medals). */
const RANK_OF_KIND: Record<string, number> = { 'championship_title:winner': 1, 'medal:gold': 1, 'medal:silver': 2, 'medal:bronze': 3, 'runner_up:runner_up': 2 };
const AWARD_KIND: Record<string, string> = { individual: 'award', hall_of_fame: 'hall_of_fame', ranking: 'ranking_honor' };

const endReason = (text: unknown): string | null => {
  const t = String(text ?? '').toLowerCase();
  if (!t) return null;
  if (/stripped|destitu/.test(t)) return 'stripped';
  if (/vacat|vago/.test(t)) return 'vacated';
  if (/abdic|did not defend|não defendeu/.test(t)) return 'abdicated';
  if (/retir|returned|aposent|retornou/.test(t)) return 'retired';
  if (/loss|lost|derrota|defeat/.test(t)) return 'lost';
  return 'unknown';
};

export interface BackfillReport {
  [table: string]: number;
}

export const backfillUniversalModel = async (db: Database): Promise<BackfillReport> => {
  const report: BackfillReport = {};
  const put = async (table: PgTable, values: Record<string, unknown>) => {
    report[getTableName(table)] = (report[getTableName(table)] ?? 0) + 1;
    return upsertRow(db, table, { createdVia: 'seed', ...values });
  };
  const domain = new Map((await all(db, T.domainValues)).map((d) => [`${d.domain}:${d.slug}`, d.id]));
  const dv = (kind: DomainKind, slug: string) => {
    const id = domain.get(`${kind}:${slug}`);
    if (!id) throw new Error(`backfill: domain value ${kind}:${slug} is not seeded`);
    return id;
  };

  const [athletes, teams, sports, competitions, editions, compTr, awards, awardTr, awardEditions, types, achievements, reigns, nationalities, athleteTeams, governing, categories, stats, orgs, sportTr] =
    await Promise.all([
      all(db, T.athletes), all(db, T.teams), all(db, T.sports), all(db, T.competitions), all(db, T.competitionEditions), all(db, T.competitionTranslations),
      all(db, T.awards), all(db, T.awardTranslations), all(db, T.awardEditions), all(db, T.achievementTypes), all(db, T.achievements), all(db, T.titleReigns),
      all(db, T.athleteNationalities), all(db, T.athleteTeams), all(db, T.sportGoverningBodies), all(db, T.sportCategories), all(db, T.athleteStats),
      all(db, T.organizations), all(db, T.sportTranslations),
    ]);
  const sportById = new Map(sports.map((s) => [s.id, s]));
  const typeById = new Map(types.map((t) => [t.id, String(t.slug)]));
  const editionById = new Map(editions.map((e) => [e.id, e]));
  const competitionById = new Map(competitions.map((c) => [c.id, c]));
  const awardEditionById = new Map(awardEditions.map((e) => [e.id, e]));

  // ── Identity: names and external ids of people, sports, competitions, organizations ──
  for (const a of athletes) {
    const names: [string, string][] = [[String(a.knownAs), 'display'], ...(a.fullName ? [[String(a.fullName), 'official'] as [string, string]] : []), ...((a.nicknames as string[]) ?? []).map((n) => [n, 'nickname'] as [string, string])];
    for (const [name, kind] of names) await put(T.entityAliases, { id: seedId('alias', a.id, kind, name), entityId: a.id, name, normalized: normalizeForSearch(name), kindId: dv(DomainKind.NameKind, kind) });
    const ids: [string, string][] = [...(a.wikidataQid ? [['wikidata', String(a.wikidataQid)] as [string, string]] : []), ...Object.entries((a.externalIds as Record<string, string>) ?? {}), ...Object.entries((a.socialLinks as Record<string, string>) ?? {})];
    for (const [provider, externalId] of ids) await put(T.entityExternalIds, { id: seedId('xid', provider, externalId), entityId: a.id, provider, externalId });
  }
  for (const e of [...sports, ...competitions, ...orgs]) {
    if (e.wikidataQid) await put(T.entityExternalIds, { id: seedId('xid', 'wikidata', String(e.wikidataQid)), entityId: e.id, provider: 'wikidata', externalId: String(e.wikidataQid) });
  }
  // Teams have no profile page; athletes keep theirs.
  for (const t of teams) await db.update(T.competitors).set({ profileVisibility: 'none', visibilityReason: 'teams have no profile page yet' }).where(eqId(T.competitors, t.id));
  for (const s of sports) if (!s.taxonLevelId) await db.update(T.sports).set({ taxonLevelId: dv(DomainKind.TaxonLevel, 'sport') }).where(eqId(T.sports, s.id));

  // ── Representation and memberships ──
  for (const n of nationalities) {
    await put(T.competitorRepresentations, { id: seedId('rep', n.athleteId as string, n.countryId as string), competitorId: n.athleteId, representationId: n.countryId, contextId: dv(DomainKind.RepresentationContext, 'citizenship'), isPrimary: n.isPrimary ? 1 : 0 });
  }
  for (const m of athleteTeams) {
    await put(T.competitorMemberships, {
      id: seedId('membership', m.id), memberId: m.athleteId, parentId: m.teamId, roleId: dv(DomainKind.MembershipRole, 'athlete'),
      fromDate: m.fromDate, toDate: m.toDate, fromYear: m.fromYear, toYear: m.toYear,
    });
  }
  for (const g of governing) {
    const role = domain.has(`${DomainKind.OrganizationRole}:${g.role}`) ? String(g.role) : 'governing_body';
    await put(T.organizationRoles, { id: seedId('orgrole', g.id), organizationId: g.organizationId, targetId: g.sportId, roleId: dv(DomainKind.OrganizationRole, role) });
  }

  // ── Categories → dimensions, values and sets ──
  const dimensionIds = new Map<string, string>();
  const setByCategory = new Map<string, string>();
  for (const c of categories) {
    const pairs = CATEGORY_VALUES[String(c.slug)];
    if (!pairs) continue;
    const valueIds: string[] = [];
    for (const [dimension, value] of pairs) {
      if (!dimensionIds.has(dimension)) dimensionIds.set(dimension, await put(T.categoryDimensions, { id: seedId('dim', dimension), slug: dimension, valueType: ORDINAL_DIMENSIONS.has(dimension) ? 'ordinal' : 'label' }));
      valueIds.push(await put(T.categoryValues, { id: seedId('catval', dimension, value), dimensionId: dimensionIds.get(dimension), slug: value, originalLabel: value }));
    }
    const setId = await put(T.categorySets, { id: seedId('catset', String(c.slug)), slug: String(c.slug), label: String(c.slug) });
    for (const valueId of valueIds) await put(T.categorySetValues, { id: seedId('catsetval', setId, valueId), setId, valueId });
    setByCategory.set(c.id, setId);
  }

  // ── Competition structure: one main event per edition (results/entries hang from it) ──
  const eventByEdition = new Map<string, string>();
  const ensureEvent = async (edition: Row) => {
    const hit = eventByEdition.get(edition.id);
    if (hit) return hit;
    const comp = competitionById.get(String(edition.competitionId))!;
    const sport = sportById.get(String(comp.sportId));
    const id = await put(T.competitionEvents, {
      id: seedId('event', edition.id), editionId: edition.id, sportId: comp.sportId, label: 'Main event',
      formatId: dv(DomainKind.CompetitionFormat, sport?.isTeamSport ? 'knockout' : 'head_to_head'),
      compositionId: dv(DomainKind.EntryComposition, sport?.isTeamSport ? 'team' : 'individual'),
      categorySetId: comp.sportCategoryId ? (setByCategory.get(String(comp.sportCategoryId)) ?? null) : null,
    });
    eventByEdition.set(edition.id, id);
    return id;
  };

  // ── Recognition definitions: one per competition × kind, one per award ──
  const nameOf = (rows: Row[], fk: string, id: string, locale: string) => rows.find((r) => r[fk] === id && r.locale === locale)?.name as string | undefined;
  const definitionFor = new Map<string, string>();
  const ensureDefinition = async (key: string, values: Record<string, unknown>, names: Record<string, string | undefined>) => {
    const hit = definitionFor.get(key);
    if (hit) return hit;
    const id = await put(T.recognitionDefinitions, { id: seedId('recdef', key), slug: key, ...values });
    for (const [locale, name] of Object.entries(names)) if (name) await put(T.recognitionDefinitionTranslations, { id: seedId('recdef_tr', key, locale), definitionId: id, locale, name });
    definitionFor.set(key, id);
    return id;
  };
  const competitionDefinition = async (comp: Row, kind: string) =>
    ensureDefinition(`${comp.slug}--${kind}`, { kindId: dv(DomainKind.RecognitionKind, kind), issuerOrgId: comp.organizationId, sportId: comp.sportId, competitionId: comp.id }, {
      en: nameOf(compTr, 'competitionId', comp.id, 'en'), 'pt-BR': nameOf(compTr, 'competitionId', comp.id, 'pt-BR'), es: nameOf(compTr, 'competitionId', comp.id, 'es'),
    });
  const awardDefinition = async (award: Row) =>
    ensureDefinition(`award--${award.slug}`, { kindId: dv(DomainKind.RecognitionKind, AWARD_KIND[String(award.awardKind)] ?? 'award'), issuerOrgId: award.organizationId, sportId: award.sportId }, {
      en: nameOf(awardTr, 'awardId', award.id, 'en'), 'pt-BR': nameOf(awardTr, 'awardId', award.id, 'pt-BR'), es: nameOf(awardTr, 'awardId', award.id, 'es'),
    });
  const awardById = new Map(awards.map((a) => [a.id, a]));

  // ── Achievements → entries + results (competitions) and grants (everything) ──
  for (const a of achievements) {
    const [kind, level] = ACHIEVEMENT_RECOGNITION[typeById.get(String(a.achievementTypeId)) ?? 'award'] ?? ['award', null];
    let definitionId: string;
    let resultId: string | null = null;
    let cycleId: string | null = null;
    if (a.competitionEditionId) {
      const edition = editionById.get(String(a.competitionEditionId))!;
      const comp = competitionById.get(String(edition.competitionId))!;
      definitionId = await competitionDefinition(comp, kind === 'runner_up' ? 'runner_up' : kind);
      const eventId = await ensureEvent(edition);
      // The entry belongs to the team when the athlete won with one (squad member), else to the athlete.
      const entrant = a.teamId && sportById.get(String(comp.sportId))?.isTeamSport ? String(a.teamId) : String(a.athleteId);
      const entryId = await put(T.competitionEntries, { id: seedId('entry', eventId, entrant), editionId: edition.id, eventId, competitorId: entrant, statusId: dv(DomainKind.EntryStatus, 'registered') });
      if (entrant !== a.athleteId) {
        await put(T.entryMembers, {
          id: seedId('member', entryId, String(a.athleteId)), entryId, personId: a.athleteId, registrationStatusId: dv(DomainKind.EntryStatus, 'registered'),
          appearanceId: dv(DomainKind.Appearance, 'unknown'), verification: 'provisional',
        });
      }
      const rank = a.rank != null ? Number(a.rank) : RANK_OF_KIND[`${kind}:${level}`];
      if (rank != null) {
        resultId = await put(T.competitionResults, {
          id: seedId('result', eventId, entryId), scope: 'event', scopeId: eventId, entryId, rank,
          statusId: dv(DomainKind.ResultStatus, rank === 1 ? 'won' : 'finished'), sourceLinkId: a.sourceLinkId,
        });
      }
    } else {
      const edition = awardEditionById.get(String(a.awardEditionId))!;
      const award = awardById.get(String(edition.awardId))!;
      definitionId = await awardDefinition(award);
      cycleId = await put(T.recognitionCycles, { id: seedId('cycle', edition.id), definitionId, year: edition.year, label: String(edition.label ?? edition.year), calendarDayId: edition.calendarDayId });
    }
    await put(T.recognitionGrants, {
      id: seedId('grant', a.id), definitionId, cycleId, competitorId: a.athleteId, viaCompetitorId: a.teamId ?? null, resultId,
      levelId: level ? dv(DomainKind.RecognitionLevel, level) : null, rank: a.rank, year: a.year, calendarDayId: a.calendarDayId,
      statusId: dv(DomainKind.GrantStatus, 'granted'), sourceLinkId: a.sourceLinkId,
    });
  }

  // ── Title reigns → holdings ──
  for (const r of reigns) {
    const comp = competitionById.get(String(r.competitionId))!;
    const definitionId = await competitionDefinition(comp, 'belt_title');
    const reason = endReason(r.endReason);
    await put(T.titleHoldings, {
      id: seedId('holding', r.id), definitionId, competitorId: r.athleteId, fromDate: r.wonDate, fromYear: r.wonYear, fromCalendarDayId: r.wonCalendarDayId,
      toDate: r.lostDate, toYear: r.lostYear, toCalendarDayId: r.lostCalendarDayId, endReasonId: reason ? dv(DomainKind.TitleEndReason, reason) : null,
      defenses: r.defenses, sourceLinkId: r.sourceLinkId,
    });
  }

  // ── Free-JSON stats → defined metrics (numeric leaves; presentation hints stay out of the database) ──
  for (const s of stats) {
    const json = (s.stats ?? {}) as Record<string, unknown>;
    const schema = String(s.statsSchemaKey);
    for (const [key, value] of Object.entries(json)) {
      if (key.startsWith('_') || key === 'schema' || (typeof value !== 'number' && typeof value !== 'string')) continue;
      const slug = `${schema}.${key}`;
      const metricId = await put(T.metricDefinitions, { id: seedId('metric', slug), slug, valueType: typeof value === 'number' ? 'count' : 'text', sportId: s.sportId });
      await put(T.competitorStatSnapshots, {
        id: seedId('stat', s.id, key), competitorId: s.athleteId, sportId: s.sportId, periodId: dv(DomainKind.StatPeriod, 'career'), periodLabel: String(s.period ?? 'career'), metricId,
        valueNumeric: typeof value === 'number' ? value : null, valueText: typeof value === 'string' ? value : null,
      });
    }
  }
  void sportTr;
  return report;
};

function eqId(table: { id: unknown }, id: string) {
  return eq(table.id as never, id);
}
