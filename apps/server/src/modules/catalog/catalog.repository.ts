import * as T from '@was/db';
import { type Database, active } from '@was/db';
import { eq } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

/** Live rows of a table (soft delete applied). */
const all = <R>(db: Database, table: PgTable & { deletedAt: T.BaseTable['deletedAt'] }): Promise<R[]> =>
  db.select().from(table).where(active(table)) as unknown as Promise<R[]>;

type Row<X extends { $inferSelect: unknown }> = X['$inferSelect'];

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
    dossiers, dossierTr, evidences, evidenceTr, provenance, conflicts, ingestionRuns, versions,
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
    all<Row<typeof T.athleteNationalities>>(db, T.athleteNationalities),
    all<Row<typeof T.athleteSports>>(db, T.athleteSports),
    all<Row<typeof T.athleteTeams>>(db, T.athleteTeams),
    all<Row<typeof T.achievements>>(db, T.achievements),
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
  ]);
  return {
    calendarDays, countries, countryTr, cities, cityTr, levels, tiers, achievementTypes, governance, governanceTr, prizeForms, prizeFormTr,
    orgKinds, orgKindTr, groups, groupTr, subgroups, subgroupTr, sports, sportTr, categories, categoryTr, governingBodies, collectionReports,
    organizations, competitions, competitionTr, editions, awards, awardTr, awardEditions, teams, observances, observanceTr, sources, sourceLinks,
    mediaLinks, athletes, athleteTr, nationalities, athleteSports, athleteTeams, achievements, reigns, milestones, milestoneTr, stats, tierHistory,
    dossiers, dossierTr, evidences, evidenceTr, provenance, conflicts, ingestionRuns, versions,
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
  'title_reigns', 'athlete_milestones', 'athlete_milestone_translations', 'athlete_stats', 'athlete_tier_history', 'greats_dossiers',
  'greats_dossier_translations', 'greats_evidences', 'greats_evidence_translations', 'field_provenance', 'field_conflicts', 'ingestion_runs',
]);
