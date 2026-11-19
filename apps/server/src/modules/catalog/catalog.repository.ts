import * as T from '@was/db';
import { type Database, active } from '@was/db';
import { eq, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/** Live rows of a table (soft delete applied). */
const all = <R>(db: Database, table: PgTable & { deletedAt: T.BaseTable['deletedAt'] }): Promise<R[]> =>
  db.select().from(table).where(active(table)) as unknown as Promise<R[]>;

type Row<X extends { $inferSelect: unknown }> = X['$inferSelect'];

/**
 * Nationalities shown on cards: legacy rows + the country an ingested athlete REPRESENTED (competitor_representations,
 * historical entities kept: USSR stays USSR). Athletes with legacy rows keep only those.
 */
const nationalitiesWithRepresentations = async (db: Database): Promise<Row<typeof T.athleteNationalities>[]> => {
  const legacy = await all<Row<typeof T.athleteNationalities>>(db, T.athleteNationalities);
  const has = new Set(legacy.map((n) => n.athleteId));
  const res = (await db.execute(sql`
    select r.id, r.created_at, r.updated_at, r.version, r.competitor_id, r.representation_id
    from competitor_representations r join athletes a on a.id = r.competitor_id join countries c on c.id = r.representation_id
    where r.deleted_at is null`)) as unknown as { rows: Record<string, unknown>[] };
  const extra = res.rows
    .filter((r) => !has.has(String(r.competitor_id)))
    .map((r, i, all) => ({
      id: String(r.id), createdAt: new Date(String(r.created_at)), createdBy: null, createdVia: 'system:canonical', updatedAt: new Date(String(r.updated_at)), updatedBy: null,
      deletedAt: null, deletedBy: null, version: Number(r.version), athleteId: String(r.competitor_id), countryId: String(r.representation_id),
      isPrimary: all.findIndex((x) => x.competitor_id === r.competitor_id) === i,
    })) as Row<typeof T.athleteNationalities>[];
  return [...legacy, ...extra];
};

/**
 * Titles of the profile pages: legacy `achievements` + the recognition grants written by the ingestion pipeline
 * (handoff v3 §4.5), in the same row shape, so one mapper path shows both. Backfilled grants (from the legacy rows)
 * are not repeated.
 */
const achievementsWithGrants = async (db: Database): Promise<Row<typeof T.achievements>[]> => {
  const legacy = await all<Row<typeof T.achievements>>(db, T.achievements);
  const res = (await db.execute(sql`
    select g.id, g.created_at, g.updated_at, g.version, g.competitor_id athlete_id, g.via_competitor_id team_id, coalesce(d.sport_id, ev.sport_id) sport_id,
      t.id achievement_type_id, e.edition_id competition_edition_id, g.calendar_day_id, coalesce(g.year, ed.year) as year, g.rank
    from recognition_grants g
    join athletes a on a.id = g.competitor_id
    join recognition_definitions d on d.id = g.definition_id
    left join domain_values lv on lv.id = g.level_id
    left join competition_results r on r.id = g.result_id
    left join competition_entries e on e.id = r.entry_id
    left join competition_events ev on ev.id = e.event_id
    left join competition_editions ed on ed.id = e.edition_id
    join achievement_types t on t.slug = case lv.slug when 'gold' then 'gold' when 'silver' then 'silver' when 'bronze' then 'bronze' else 'champion' end
    where g.deleted_at is null and g.created_via = 'system:canonical' and e.edition_id is not null`)) as unknown as { rows: Record<string, unknown>[] };
  const fromGrants = res.rows.map((r) => ({
    id: String(r.id), createdAt: new Date(String(r.created_at)), createdBy: null, createdVia: 'system:canonical', updatedAt: new Date(String(r.updated_at)), updatedBy: null,
    deletedAt: null, deletedBy: null, version: Number(r.version), athleteId: String(r.athlete_id), teamId: (r.team_id as string | null) ?? null, sportId: (r.sport_id as string | null) ?? null,
    sportCategoryId: null, achievementTypeId: String(r.achievement_type_id), competitionEditionId: String(r.competition_edition_id), awardEditionId: null,
    calendarDayId: (r.calendar_day_id as string | null) ?? null, year: Number(r.year), rank: (r.rank as number | null) ?? null, sourceLinkId: null,
  })) as Row<typeof T.achievements>[];
  return [...legacy, ...fromGrants];
};

/**
 * Loads the catalog (aspects + athletes and everything tied to them) in one go. Small, read-mostly data: the
 * CatalogCache keeps it in memory and drops it when the BaseRepository writes any of these tables. Later:
 * materialized views (mv_athlete_summary, doc 03) when the catalog grows.
 */
export const loadCatalogRows = async (db: Database) => {
  const [
    calendarDays, countries, countryTr, cities, cityTr, levels, tiers, achievementTypes, governance, governanceTr, prizeForms, prizeFormTr,
    orgKinds, orgKindTr, groups, groupTr, subgroups, subgroupTr, sports, sportTr, categories, categoryTr, governingBodies, collectionReports,
    organizations, competitions, competitionTr, editions, awards, awardTr, awardEditions, teams, observances, observanceTr, sources, sourceLinks,
    mediaLinks, athletes, athleteTr, nationalities, athleteSports, athleteTeams, achievements, reigns, milestones, milestoneTr, stats, tierHistory,
    dossiers, dossierTr, evidences, evidenceTr, provenance, conflicts, ingestionRuns, versions, programmeSports, sportRelations, domainValues, contentSections, contentSectionTr, competitorRows,
  ] = await Promise.all([
    all<Row<typeof T.calendarDays>>(db, T.calendarDays),
    all<Row<typeof T.countries>>(db, T.countries),
    all<Row<typeof T.countryTranslations>>(db, T.countryTranslations),
    all<Row<typeof T.cities>>(db, T.cities),
    all<Row<typeof T.cityTranslations>>(db, T.cityTranslations),
    all<Row<typeof T.competitionLevels>>(db, T.competitionLevels),
    all<Row<typeof T.championTiers>>(db, T.championTiers),
    all<Row<typeof T.achievementTypes>>(db, T.achievementTypes),
    all<Row<typeof T.governanceModels>>(db, T.governanceModels),
    all<Row<typeof T.governanceModelTranslations>>(db, T.governanceModelTranslations),
    all<Row<typeof T.prizeForms>>(db, T.prizeForms),
    all<Row<typeof T.prizeFormTranslations>>(db, T.prizeFormTranslations),
    all<Row<typeof T.organizationKinds>>(db, T.organizationKinds),
    all<Row<typeof T.organizationKindTranslations>>(db, T.organizationKindTranslations),
    all<Row<typeof T.sportGroups>>(db, T.sportGroups),
    all<Row<typeof T.sportGroupTranslations>>(db, T.sportGroupTranslations),
    all<Row<typeof T.sportSubgroups>>(db, T.sportSubgroups),
    all<Row<typeof T.sportSubgroupTranslations>>(db, T.sportSubgroupTranslations),
    all<Row<typeof T.sports>>(db, T.sports),
    all<Row<typeof T.sportTranslations>>(db, T.sportTranslations),
    all<Row<typeof T.sportCategories>>(db, T.sportCategories),
    all<Row<typeof T.sportCategoryTranslations>>(db, T.sportCategoryTranslations),
    all<Row<typeof T.sportGoverningBodies>>(db, T.sportGoverningBodies),
    all<Row<typeof T.sportCollectionReports>>(db, T.sportCollectionReports),
    all<Row<typeof T.organizations>>(db, T.organizations),
    all<Row<typeof T.competitions>>(db, T.competitions),
    all<Row<typeof T.competitionTranslations>>(db, T.competitionTranslations),
    all<Row<typeof T.competitionEditions>>(db, T.competitionEditions),
    all<Row<typeof T.awards>>(db, T.awards),
    all<Row<typeof T.awardTranslations>>(db, T.awardTranslations),
    all<Row<typeof T.awardEditions>>(db, T.awardEditions),
    all<Row<typeof T.teams>>(db, T.teams),
    all<Row<typeof T.observanceDays>>(db, T.observanceDays),
    all<Row<typeof T.observanceDayTranslations>>(db, T.observanceDayTranslations),
    all<Row<typeof T.sources>>(db, T.sources),
    all<Row<typeof T.sourceLinks>>(db, T.sourceLinks),
    all<Row<typeof T.mediaLinks>>(db, T.mediaLinks),
    all<Row<typeof T.athletes>>(db, T.athletes),
    all<Row<typeof T.athleteTranslations>>(db, T.athleteTranslations),
    nationalitiesWithRepresentations(db),
    all<Row<typeof T.athleteSports>>(db, T.athleteSports),
    all<Row<typeof T.athleteTeams>>(db, T.athleteTeams),
    achievementsWithGrants(db),
    all<Row<typeof T.titleReigns>>(db, T.titleReigns),
    all<Row<typeof T.athleteMilestones>>(db, T.athleteMilestones),
    all<Row<typeof T.athleteMilestoneTranslations>>(db, T.athleteMilestoneTranslations),
    all<Row<typeof T.athleteStats>>(db, T.athleteStats),
    all<Row<typeof T.athleteTierHistory>>(db, T.athleteTierHistory),
    all<Row<typeof T.greatsDossiers>>(db, T.greatsDossiers),
    all<Row<typeof T.greatsDossierTranslations>>(db, T.greatsDossierTranslations),
    all<Row<typeof T.greatsEvidences>>(db, T.greatsEvidences),
    all<Row<typeof T.greatsEvidenceTranslations>>(db, T.greatsEvidenceTranslations),
    all<Row<typeof T.fieldProvenance>>(db, T.fieldProvenance),
    all<Row<typeof T.fieldConflicts>>(db, T.fieldConflicts),
    all<Row<typeof T.ingestionRuns>>(db, T.ingestionRuns),
    // Version history of the profiles: only the 4 columns shown (never the snapshot/diff JSONB, the bulk of the table).
    db
      .select({ entityId: T.entityVersions.entityId, versionNumber: T.entityVersions.versionNumber, summary: T.entityVersions.summary, author: T.entityVersions.author })
      .from(T.entityVersions)
      .where(active(T.entityVersions, eq(T.entityVersions.entityType, 'athletes'))),
    all<Row<typeof T.competitionProgramSports>>(db, T.competitionProgramSports),
    all<Row<typeof T.sportRelations>>(db, T.sportRelations),
    all<Row<typeof T.domainValues>>(db, T.domainValues),
    all<Row<typeof T.sportContentSections>>(db, T.sportContentSections),
    all<Row<typeof T.sportContentSectionTranslations>>(db, T.sportContentSectionTranslations),
    db.select({ id: T.competitors.id, profileVisibility: T.competitors.profileVisibility }).from(T.competitors).where(active(T.competitors)),
  ]);
  return {
    calendarDays, countries, countryTr, cities, cityTr, levels, tiers, achievementTypes, governance, governanceTr, prizeForms, prizeFormTr,
    orgKinds, orgKindTr, groups, groupTr, subgroups, subgroupTr, sports, sportTr, categories, categoryTr, governingBodies, collectionReports,
    organizations, competitions, competitionTr, editions, awards, awardTr, awardEditions, teams, observances, observanceTr, sources, sourceLinks,
    mediaLinks, athletes, athleteTr, nationalities, athleteSports, athleteTeams, achievements, reigns, milestones, milestoneTr, stats, tierHistory,
    dossiers, dossierTr, evidences, evidenceTr, provenance, conflicts, ingestionRuns, versions, programmeSports, sportRelations, domainValues, contentSections, contentSectionTr, competitorRows,
  };
};
export type CatalogRows = Awaited<ReturnType<typeof loadCatalogRows>>;

/** Tables whose writes invalidate the cached catalog (participation tables are always queried live). */
export const CATALOG_TABLES = new Set([
  'calendar_days', 'countries', 'country_translations', 'cities', 'city_translations', 'competition_levels', 'champion_tiers', 'achievement_types',
  'governance_models', 'governance_model_translations', 'prize_forms', 'prize_form_translations', 'organization_kinds', 'organization_kind_translations',
  'sport_groups', 'sport_group_translations', 'sport_subgroups', 'sport_subgroup_translations', 'sports', 'sport_translations', 'sport_categories',
  'sport_category_translations', 'sport_governing_bodies', 'sport_collection_reports', 'organizations', 'competitions', 'competition_translations',
  'competition_editions', 'awards', 'award_translations', 'award_editions', 'teams', 'observance_days', 'observance_day_translations', 'sources',
  'source_links', 'media_links', 'athletes', 'athlete_translations', 'athlete_nationalities', 'athlete_sports', 'athlete_teams', 'achievements',
  'title_reigns', 'recognition_grants', 'athlete_milestones', 'athlete_milestone_translations', 'athlete_stats', 'athlete_tier_history', 'greats_dossiers',
  'greats_dossier_translations', 'greats_evidences', 'greats_evidence_translations', 'field_provenance', 'field_conflicts', 'ingestion_runs',
  'competition_program_sports', 'sport_relations', 'domain_values', 'sport_content_sections', 'sport_content_section_translations', 'competitors', 'competitor_representations',
]);
