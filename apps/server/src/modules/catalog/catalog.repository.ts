import * as T from '@was/db';
import { BaseReadRepository } from '@was/db';
import { eq, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

type Row<X extends { $inferSelect: unknown }> = X['$inferSelect'];

/**
 * Read model of the catalog: loads the aspects + athletes and everything tied to them in one go. Small, read-mostly
 * data: the CatalogCache keeps it in memory and drops it when the BaseRepository writes any of these tables. Later:
 * materialized views (mv_athlete_summary, doc 03) when the catalog grows.
 */
export class CatalogRepository extends BaseReadRepository {
  /** Live rows of a table (soft delete applied). */
  private all<R>(table: PgTable & { deletedAt: T.BaseTable['deletedAt'] }): Promise<R[]> {
    return this.db.select().from(table).where(this.active(table)) as unknown as Promise<R[]>;
  }

  /**
   * Nationalities shown on cards: legacy rows + the country an ingested athlete REPRESENTED (competitor_representations,
   * historical entities kept: USSR stays USSR). Athletes with legacy rows keep only those.
   */
  private async nationalitiesWithRepresentations(): Promise<Row<typeof T.athleteNationalities>[]> {
    const legacy = await this.all<Row<typeof T.athleteNationalities>>(T.athleteNationalities);
    const has = new Set(legacy.map((n) => n.athleteId));
    const rows = await this.selectRows<Record<string, unknown>>(sql`
    select r.id, r.created_at, r.updated_at, r.version, r.competitor_id, r.representation_id
    from competitor_representations r join athletes a on a.id = r.competitor_id join countries c on c.id = r.representation_id
    where r.deleted_at is null`);
    const extra = rows
      .filter((r) => !has.has(String(r.competitor_id)))
      .map((r, i, all) => ({
        id: String(r.id),
        createdAt: new Date(String(r.created_at)),
        createdBy: null,
        createdVia: 'system:canonical',
        updatedAt: new Date(String(r.updated_at)),
        updatedBy: null,
        deletedAt: null,
        deletedBy: null,
        version: Number(r.version),
        athleteId: String(r.competitor_id),
        countryId: String(r.representation_id),
        isPrimary: all.findIndex((x) => x.competitor_id === r.competitor_id) === i,
      })) as Row<typeof T.athleteNationalities>[];
    return [...legacy, ...extra];
  }

  /**
   * Titles of the profile pages: legacy `achievements` + the recognition grants written by the ingestion pipeline
   * (handoff v3 §4.5), in the same row shape, so one mapper path shows both. Backfilled grants (from the legacy rows)
   * are not repeated.
   */
  private async achievementsWithGrants(): Promise<Row<typeof T.achievements>[]> {
    const legacy = await this.all<Row<typeof T.achievements>>(T.achievements);
    const rows = await this.selectRows<Record<string, unknown>>(sql`
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
    where g.deleted_at is null and g.created_via = 'system:canonical' and e.edition_id is not null`);
    const fromGrants = rows.map((r) => ({
      id: String(r.id),
      createdAt: new Date(String(r.created_at)),
      createdBy: null,
      createdVia: 'system:canonical',
      updatedAt: new Date(String(r.updated_at)),
      updatedBy: null,
      deletedAt: null,
      deletedBy: null,
      version: Number(r.version),
      athleteId: String(r.athlete_id),
      teamId: (r.team_id as string | null) ?? null,
      sportId: (r.sport_id as string | null) ?? null,
      sportCategoryId: null,
      achievementTypeId: String(r.achievement_type_id),
      competitionEditionId: String(r.competition_edition_id),
      awardEditionId: null,
      calendarDayId: (r.calendar_day_id as string | null) ?? null,
      year: Number(r.year),
      rank: (r.rank as number | null) ?? null,
      sourceLinkId: null,
    })) as Row<typeof T.achievements>[];
    return [...legacy, ...fromGrants];
  }

  /** Every catalog table, live rows only (one round trip per table, all in parallel). */
  async load() {
    const [
      calendarDays,
      countries,
      countryTr,
      cities,
      cityTr,
      levels,
      tiers,
      achievementTypes,
      governance,
      governanceTr,
      prizeForms,
      prizeFormTr,
      orgKinds,
      orgKindTr,
      groups,
      groupTr,
      subgroups,
      subgroupTr,
      sports,
      sportTr,
      categories,
      categoryTr,
      governingBodies,
      collectionReports,
      organizations,
      competitions,
      competitionTr,
      editions,
      awards,
      awardTr,
      awardEditions,
      teams,
      observances,
      observanceTr,
      sources,
      sourceLinks,
      mediaLinks,
      athletes,
      athleteTr,
      nationalities,
      athleteSports,
      athleteTeams,
      achievements,
      reigns,
      milestones,
      milestoneTr,
      stats,
      tierHistory,
      dossiers,
      dossierTr,
      evidences,
      evidenceTr,
      provenance,
      conflicts,
      ingestionRuns,
      versions,
      programmeSports,
      sportRelations,
      domainValues,
      contentSections,
      contentSectionTr,
      competitorRows,
    ] = await Promise.all([
      this.all<Row<typeof T.calendarDays>>(T.calendarDays),
      this.all<Row<typeof T.countries>>(T.countries),
      this.all<Row<typeof T.countryTranslations>>(T.countryTranslations),
      this.all<Row<typeof T.cities>>(T.cities),
      this.all<Row<typeof T.cityTranslations>>(T.cityTranslations),
      this.all<Row<typeof T.competitionLevels>>(T.competitionLevels),
      this.all<Row<typeof T.championTiers>>(T.championTiers),
      this.all<Row<typeof T.achievementTypes>>(T.achievementTypes),
      this.all<Row<typeof T.governanceModels>>(T.governanceModels),
      this.all<Row<typeof T.governanceModelTranslations>>(T.governanceModelTranslations),
      this.all<Row<typeof T.prizeForms>>(T.prizeForms),
      this.all<Row<typeof T.prizeFormTranslations>>(T.prizeFormTranslations),
      this.all<Row<typeof T.organizationKinds>>(T.organizationKinds),
      this.all<Row<typeof T.organizationKindTranslations>>(T.organizationKindTranslations),
      this.all<Row<typeof T.sportGroups>>(T.sportGroups),
      this.all<Row<typeof T.sportGroupTranslations>>(T.sportGroupTranslations),
      this.all<Row<typeof T.sportSubgroups>>(T.sportSubgroups),
      this.all<Row<typeof T.sportSubgroupTranslations>>(T.sportSubgroupTranslations),
      this.all<Row<typeof T.sports>>(T.sports),
      this.all<Row<typeof T.sportTranslations>>(T.sportTranslations),
      this.all<Row<typeof T.sportCategories>>(T.sportCategories),
      this.all<Row<typeof T.sportCategoryTranslations>>(T.sportCategoryTranslations),
      this.all<Row<typeof T.sportGoverningBodies>>(T.sportGoverningBodies),
      this.all<Row<typeof T.sportCollectionReports>>(T.sportCollectionReports),
      this.all<Row<typeof T.organizations>>(T.organizations),
      this.all<Row<typeof T.competitions>>(T.competitions),
      this.all<Row<typeof T.competitionTranslations>>(T.competitionTranslations),
      this.all<Row<typeof T.competitionEditions>>(T.competitionEditions),
      this.all<Row<typeof T.awards>>(T.awards),
      this.all<Row<typeof T.awardTranslations>>(T.awardTranslations),
      this.all<Row<typeof T.awardEditions>>(T.awardEditions),
      this.all<Row<typeof T.teams>>(T.teams),
      this.all<Row<typeof T.observanceDays>>(T.observanceDays),
      this.all<Row<typeof T.observanceDayTranslations>>(T.observanceDayTranslations),
      this.all<Row<typeof T.sources>>(T.sources),
      this.all<Row<typeof T.sourceLinks>>(T.sourceLinks),
      this.all<Row<typeof T.mediaLinks>>(T.mediaLinks),
      this.all<Row<typeof T.athletes>>(T.athletes),
      this.all<Row<typeof T.athleteTranslations>>(T.athleteTranslations),
      this.nationalitiesWithRepresentations(),
      this.all<Row<typeof T.athleteSports>>(T.athleteSports),
      this.all<Row<typeof T.athleteTeams>>(T.athleteTeams),
      this.achievementsWithGrants(),
      this.all<Row<typeof T.titleReigns>>(T.titleReigns),
      this.all<Row<typeof T.athleteMilestones>>(T.athleteMilestones),
      this.all<Row<typeof T.athleteMilestoneTranslations>>(T.athleteMilestoneTranslations),
      this.all<Row<typeof T.athleteStats>>(T.athleteStats),
      this.all<Row<typeof T.athleteTierHistory>>(T.athleteTierHistory),
      this.all<Row<typeof T.greatsDossiers>>(T.greatsDossiers),
      this.all<Row<typeof T.greatsDossierTranslations>>(T.greatsDossierTranslations),
      this.all<Row<typeof T.greatsEvidences>>(T.greatsEvidences),
      this.all<Row<typeof T.greatsEvidenceTranslations>>(T.greatsEvidenceTranslations),
      this.all<Row<typeof T.fieldProvenance>>(T.fieldProvenance),
      this.all<Row<typeof T.fieldConflicts>>(T.fieldConflicts),
      this.all<Row<typeof T.ingestionRuns>>(T.ingestionRuns),
      // Version history of the profiles: only the 4 columns shown (never the snapshot/diff JSONB, the bulk of the table).
      this.db
        .select({
          entityId: T.entityVersions.entityId,
          versionNumber: T.entityVersions.versionNumber,
          summary: T.entityVersions.summary,
          author: T.entityVersions.author,
        })
        .from(T.entityVersions)
        .where(this.active(T.entityVersions, eq(T.entityVersions.entityType, 'athletes'))),
      this.all<Row<typeof T.competitionProgramSports>>(T.competitionProgramSports),
      this.all<Row<typeof T.sportRelations>>(T.sportRelations),
      this.all<Row<typeof T.domainValues>>(T.domainValues),
      this.all<Row<typeof T.sportContentSections>>(T.sportContentSections),
      this.all<Row<typeof T.sportContentSectionTranslations>>(T.sportContentSectionTranslations),
      this.db.select({ id: T.competitors.id, profileVisibility: T.competitors.profileVisibility }).from(T.competitors).where(this.active(T.competitors)),
    ]);
    return {
      calendarDays,
      countries,
      countryTr,
      cities,
      cityTr,
      levels,
      tiers,
      achievementTypes,
      governance,
      governanceTr,
      prizeForms,
      prizeFormTr,
      orgKinds,
      orgKindTr,
      groups,
      groupTr,
      subgroups,
      subgroupTr,
      sports,
      sportTr,
      categories,
      categoryTr,
      governingBodies,
      collectionReports,
      organizations,
      competitions,
      competitionTr,
      editions,
      awards,
      awardTr,
      awardEditions,
      teams,
      observances,
      observanceTr,
      sources,
      sourceLinks,
      mediaLinks,
      athletes,
      athleteTr,
      nationalities,
      athleteSports,
      athleteTeams,
      achievements,
      reigns,
      milestones,
      milestoneTr,
      stats,
      tierHistory,
      dossiers,
      dossierTr,
      evidences,
      evidenceTr,
      provenance,
      conflicts,
      ingestionRuns,
      versions,
      programmeSports,
      sportRelations,
      domainValues,
      contentSections,
      contentSectionTr,
      competitorRows,
    };
  }
}
