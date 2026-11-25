import * as T from '@was/db';
import { ATHLETE_STATS_EXTENSION_PREFIX, BaseReadRepository } from '@was/db';
import { DomainKind } from '@was/shared';
import { eq, getTableColumns, sql } from 'drizzle-orm';
import type { PgTable } from 'drizzle-orm/pg-core';

import { AWARD_DEFINITION_PREFIX, AWARD_KIND_OF_RECOGNITION, HIDDEN_EXTERNAL_ID, MEDAL_LEVELS, SOCIAL_PROVIDERS } from './catalog.const';
import { jsonbOrderedObject } from './catalog-identity.helper';
import type { CatalogNameRow } from './catalog-name-row.type';
import type {
  CatalogAwardCycleRow,
  CatalogAwardRow,
  CatalogCategoryRow,
  CatalogGrantRow,
  CatalogHoldingRow,
  CatalogIdentityRow,
  CatalogMembershipRow,
  CatalogNationalityRow,
  CatalogStatsRow,
} from './catalog-row.interface';

type Row<X extends { $inferSelect: unknown }> = X['$inferSelect'];

/** Athlete columns the catalog reads (the Wikidata QID comes from entity_external_ids). */
const ATHLETE_COLUMNS = getTableColumns(T.athletes);

/**
 * Read model of the catalog: loads the aspects + athletes and everything tied to them in one go, from the universal
 * model only (recognitions, holdings, representations, memberships, category sets, stat extensions, external ids and
 * aliases), mapped to the rows the CatalogView reads. Small, read-mostly data: the CatalogCache keeps it in memory and
 * drops it when the BaseRepository writes any of these tables. Later: materialized views (mv_athlete_summary, doc 03).
 */
export class CatalogRepository extends BaseReadRepository {
  /** Live rows of a table (soft delete applied). */
  private all<R>(table: PgTable & { deletedAt: T.BaseTable['deletedAt'] }): Promise<R[]> {
    return this.db.select().from(table).where(this.active(table)) as unknown as Promise<R[]>;
  }

  /** Live rows in storage order (the order they were recorded), whatever index the planner picks. */
  private stored<R>(table: PgTable & { deletedAt: T.BaseTable['deletedAt'] }): Promise<R[]> {
    return this.db.select().from(table).where(this.active(table)).orderBy(sql`ctid`) as unknown as Promise<R[]>;
  }

  /** Competition edition reached by each grant that derives from a result (grant → result → entry → edition). */
  private grantEditions() {
    return this.selectRows<{ id: string; edition_id: string | null; edition_year: number | null }>(sql`
    select g.id, e.edition_id, ed.year edition_year
    from recognition_grants g
    join competition_results r on r.id = g.result_id
    join competition_entries e on e.id = r.entry_id
    left join competition_editions ed on ed.id = e.edition_id
    where g.deleted_at is null`);
  }

  /** Nicknames of every entity, in the order they were recorded. */
  private nicknames() {
    return this.selectRows<{ entity_id: string; name: string }>(sql`
    select a.entity_id, a.name
    from (select x.*, row_number() over (order by x.ctid) ord from entity_aliases x where x.deleted_at is null) a
    join domain_values k on k.id = a.kind_id and k.domain = ${DomainKind.NameKind} and k.slug = 'nickname'
    order by a.ord`);
  }

  /** Statistics documents of the competitors (registered `athlete-stats.*` extensions). */
  private statExtensions() {
    return this.selectRows<{ competitor_id: string; sport_id: string | null; period_label: string; key: string; data: Record<string, unknown> }>(sql`
    select x.competitor_id, x.sport_id, x.period_label, s.key, x.data
    from (select e.*, row_number() over (order by e.ctid) ord from competitor_stat_extensions e where e.deleted_at is null) x
    join extension_schemas s on s.id = x.extension_schema_id and starts_with(s.key, ${ATHLETE_STATS_EXTENSION_PREFIX})
    order by x.ord`);
  }

  /** Every catalog table, live rows only (one round trip per table, all in parallel), mapped to the view's rows. */
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
      categorySets,
      categorySetTr,
      governingBodies,
      collectionReports,
      organizations,
      competitions,
      competitionTr,
      editions,
      definitions,
      definitionTr,
      cycles,
      teams,
      observances,
      observanceTr,
      sources,
      sourceLinks,
      mediaLinks,
      athletes,
      athleteTr,
      representations,
      athleteSports,
      memberships,
      grantRows,
      grantEditions,
      holdingRows,
      milestones,
      milestoneTr,
      statRows,
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
      externalIdRows,
      nicknameRows,
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
      this.stored<Row<typeof T.categorySets>>(T.categorySets),
      this.stored<Row<typeof T.categorySetTranslations>>(T.categorySetTranslations),
      this.all<Row<typeof T.sportGoverningBodies>>(T.sportGoverningBodies),
      this.all<Row<typeof T.sportCollectionReports>>(T.sportCollectionReports),
      this.all<Row<typeof T.organizations>>(T.organizations),
      this.all<Row<typeof T.competitions>>(T.competitions),
      this.all<Row<typeof T.competitionTranslations>>(T.competitionTranslations),
      this.all<Row<typeof T.competitionEditions>>(T.competitionEditions),
      // By slug: award definitions are listed in slug order (sport associations, prize forms).
      this.db.select().from(T.recognitionDefinitions).where(this.active(T.recognitionDefinitions)).orderBy(T.recognitionDefinitions.slug),
      this.stored<Row<typeof T.recognitionDefinitionTranslations>>(T.recognitionDefinitionTranslations),
      this.stored<Row<typeof T.recognitionCycles>>(T.recognitionCycles),
      this.all<Row<typeof T.teams>>(T.teams),
      this.all<Row<typeof T.observanceDays>>(T.observanceDays),
      this.all<Row<typeof T.observanceDayTranslations>>(T.observanceDayTranslations),
      this.all<Row<typeof T.sources>>(T.sources),
      this.all<Row<typeof T.sourceLinks>>(T.sourceLinks),
      this.all<Row<typeof T.mediaLinks>>(T.mediaLinks),
      this.db.select(ATHLETE_COLUMNS).from(T.athletes).where(this.active(T.athletes)),
      this.all<Row<typeof T.athleteTranslations>>(T.athleteTranslations),
      // By country, then as recorded (the order the cards have always listed nationalities in).
      this.db
        .select()
        .from(T.competitorRepresentations)
        .where(this.active(T.competitorRepresentations))
        .orderBy(T.competitorRepresentations.representationId, sql`ctid`),
      this.all<Row<typeof T.athleteSports>>(T.athleteSports),
      this.stored<Row<typeof T.competitorMemberships>>(T.competitorMemberships),
      // Dated grants first (by calendar day), then as recorded: the order the profiles have always listed titles in.
      this.db
        .select()
        .from(T.recognitionGrants)
        .where(this.active(T.recognitionGrants))
        .orderBy(T.recognitionGrants.calendarDayId, sql`ctid`),
      this.grantEditions(),
      this.stored<Row<typeof T.titleHoldings>>(T.titleHoldings),
      this.all<Row<typeof T.athleteMilestones>>(T.athleteMilestones),
      this.all<Row<typeof T.athleteMilestoneTranslations>>(T.athleteMilestoneTranslations),
      this.statExtensions(),
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
      this.db
        .select({ entityId: T.entityExternalIds.entityId, provider: T.entityExternalIds.provider, externalId: T.entityExternalIds.externalId })
        .from(T.entityExternalIds)
        .where(this.active(T.entityExternalIds, eq(T.entityExternalIds.isCurrent, true)))
        .orderBy(sql`ctid`),
      this.nicknames(),
    ]);

    const athleteIds = new Set(athletes.map((a) => a.id));
    const countryIds = new Set(countries.map((c) => c.id));
    const teamIds = new Set(teams.map((t) => t.id));
    const definitionById = new Map(definitions.map((d) => [d.id, d]));
    const slugOf = new Map(domainValues.map((d) => [d.id, d.slug]));
    const typeIdOf = new Map(achievementTypes.map((t) => [t.slug, t.id]));

    // Award definitions: recognition definitions without a competition that carry a level.
    const awardDefinitions: CatalogAwardRow[] = definitions
      .filter((d) => !d.competitionId && d.competitionLevelId)
      .map((d) => ({
        id: d.id,
        slug: d.slug.startsWith(AWARD_DEFINITION_PREFIX) ? d.slug.slice(AWARD_DEFINITION_PREFIX.length) : d.slug,
        sportId: d.sportId,
        organizationId: d.issuerOrgId,
        competitionLevelId: d.competitionLevelId!,
        awardKind: AWARD_KIND_OF_RECOGNITION[slugOf.get(d.kindId) ?? ''] ?? 'individual',
        prizeFormId: d.prizeFormId,
      }));
    const awardIds = new Set(awardDefinitions.map((a) => a.id));
    const awardTr: CatalogNameRow[] = definitionTr.filter((t) => awardIds.has(t.definitionId)).map((t) => ({ parentId: t.definitionId, locale: t.locale, name: t.name }));
    // A cycle without its own label was stored with the year as label.
    const awardCycles: CatalogAwardCycleRow[] = cycles
      .filter((c) => awardIds.has(c.definitionId))
      .map((c) => ({ id: c.id, awardId: c.definitionId, year: c.year, label: c.label === String(c.year) ? null : c.label }));
    const awardCycleIds = new Set(awardCycles.map((c) => c.id));

    // Grants of athletes: competition results (edition) or award cycles; the display type falls back to the level.
    const editionOf = new Map(grantEditions.map((e) => [e.id, e]));
    const cycleYear = new Map(awardCycles.map((c) => [c.id, c.year]));
    const grants: CatalogGrantRow[] = grantRows.flatMap((g) => {
      const edition = editionOf.get(g.id);
      const awardCycleId = !edition?.edition_id && g.cycleId && awardCycleIds.has(g.cycleId) ? g.cycleId : null;
      const level = g.levelId ? slugOf.get(g.levelId) : undefined;
      const typeId = g.achievementTypeId ?? typeIdOf.get(level && MEDAL_LEVELS.has(level) ? level : 'champion');
      if (!athleteIds.has(g.competitorId) || !definitionById.has(g.definitionId) || !typeId || (!edition?.edition_id && !awardCycleId)) return [];
      return [
        {
          id: g.id,
          athleteId: g.competitorId,
          teamId: g.viaCompetitorId,
          categoryId: g.categorySetId,
          achievementTypeId: typeId,
          competitionEditionId: edition?.edition_id ?? null,
          awardCycleId,
          calendarDayId: g.calendarDayId,
          year: Number(g.year ?? edition?.edition_year ?? (awardCycleId ? cycleYear.get(awardCycleId) : null)),
          rank: g.rank,
          sourceLinkId: g.sourceLinkId,
        },
      ];
    });

    // Title holdings of a competition's title (absorbed `title_reigns`).
    const holdings: CatalogHoldingRow[] = holdingRows.flatMap((h) => {
      const competitionId = definitionById.get(h.definitionId)?.competitionId;
      return competitionId
        ? [{ athleteId: h.competitorId, competitionId, wonDate: h.fromDate, lostDate: h.toDate, endReason: h.endNote, sourceLinkId: h.sourceLinkId }]
        : [];
    });

    // Countries an athlete represents (historical entities kept: USSR stays USSR), one row per country.
    const seenNationality = new Set<string>();
    const nationalities: CatalogNationalityRow[] = representations.flatMap((r) => {
      const key = `${r.competitorId}|${r.representationId}`;
      if (!athleteIds.has(r.competitorId) || !countryIds.has(r.representationId) || seenNationality.has(key)) return [];
      seenNationality.add(key);
      return [{ athleteId: r.competitorId, countryId: r.representationId, isPrimary: r.isPrimary === 1 }];
    });

    const teamMemberships: CatalogMembershipRow[] = memberships
      .filter((m) => athleteIds.has(m.memberId) && teamIds.has(m.parentId))
      .map((m) => ({ athleteId: m.memberId, teamId: m.parentId, fromDate: m.fromDate, toDate: m.toDate, fromYear: m.fromYear, toYear: m.toYear, role: m.roleLabel }));

    // Category sets bound to a sport are its named categories (absorbed `sport_categories`).
    const categories: CatalogCategoryRow[] = categorySets.flatMap((c) => (c.sportId ? [{ id: c.id, sportId: c.sportId, parentCategoryId: c.parentSetId, slug: c.slug }] : []));
    const categoryTr: CatalogNameRow[] = categorySetTr.map((t) => ({ parentId: t.setId, locale: t.locale, name: t.name }));

    const stats: CatalogStatsRow[] = statRows
      .filter((s) => athleteIds.has(s.competitor_id))
      .map((s) => ({
        athleteId: s.competitor_id,
        sportId: s.sport_id,
        period: s.period_label,
        statsSchemaKey: s.key.slice(ATHLETE_STATS_EXTENSION_PREFIX.length),
        stats: s.data,
      }));

    // Identity of the athletes: Wikidata QID, nicknames, catalog identifiers and social profiles.
    const identity = new Map<string, CatalogIdentityRow>();
    const identityOf = (athleteId: string) => {
      let row = identity.get(athleteId);
      if (!row) identity.set(athleteId, (row = { athleteId, wikidataQid: null, nicknames: [], externalIds: {}, social: {} }));
      return row;
    };
    const socialPairs = new Map<string, [string, string][]>();
    const idPairs = new Map<string, [string, string][]>();
    for (const x of externalIdRows) {
      if (!athleteIds.has(x.entityId)) continue;
      const row = identityOf(x.entityId);
      if (x.provider === 'wikidata') row.wikidataQid ??= x.externalId;
      const bucket = SOCIAL_PROVIDERS.has(x.provider) ? socialPairs : HIDDEN_EXTERNAL_ID.test(x.provider) ? null : idPairs;
      if (bucket) bucket.set(x.entityId, [...(bucket.get(x.entityId) ?? []), [x.provider, x.externalId]]);
    }
    for (const [id, pairs] of socialPairs) identityOf(id).social = jsonbOrderedObject(pairs);
    for (const [id, pairs] of idPairs) identityOf(id).externalIds = jsonbOrderedObject(pairs);
    for (const n of nicknameRows) if (athleteIds.has(n.entity_id)) identityOf(n.entity_id).nicknames.push(n.name);

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
      awardDefinitions,
      awardTr,
      awardCycles,
      teams,
      observances,
      observanceTr,
      sources,
      sourceLinks,
      mediaLinks,
      athletes,
      athleteTr,
      identity,
      nationalities,
      athleteSports,
      memberships: teamMemberships,
      grants,
      holdings,
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
