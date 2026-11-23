// Rows of the catalog snapshot that the CatalogRepository derives from the universal model (recognitions, holdings,
// representations, memberships, category sets, stat extensions, external ids and aliases) in the shape the view reads.

/** A recognition grant of an athlete: a competition result (edition) or an award cycle. */
export interface CatalogGrantRow {
  id: string;
  athleteId: string;
  /** Team through which it was won (viaCompetitorId). */
  teamId: string | null;
  /** Category set (division) it was granted in. */
  categoryId: string | null;
  achievementTypeId: string;
  competitionEditionId: string | null;
  awardCycleId: string | null;
  calendarDayId: string | null;
  year: number;
  rank: number | null;
  sourceLinkId: string | null;
}

/** An award-like recognition definition (no competition, with a level). */
export interface CatalogAwardRow {
  id: string;
  slug: string;
  sportId: string | null;
  organizationId: string | null;
  competitionLevelId: string;
  awardKind: string;
  prizeFormId: string | null;
}

/** A cycle (yearly edition) of an award definition. */
export interface CatalogAwardCycleRow {
  id: string;
  awardId: string;
  year: number | null;
  label: string | null;
}

/** A country an athlete represents. */
export interface CatalogNationalityRow {
  athleteId: string;
  countryId: string;
  isPrimary: boolean;
}

/** Membership of an athlete in a team over time. */
export interface CatalogMembershipRow {
  athleteId: string;
  teamId: string;
  fromDate: string | null;
  toDate: string | null;
  fromYear: number | null;
  toYear: number | null;
  role: string | null;
}

/** Holding of a competition's title (belt reign). */
export interface CatalogHoldingRow {
  athleteId: string;
  competitionId: string;
  wonDate: string;
  lostDate: string | null;
  endReason: string | null;
  sourceLinkId: string | null;
}

/** Sport-specific statistics document of an athlete (registered stat extension). */
export interface CatalogStatsRow {
  athleteId: string;
  sportId: string | null;
  period: string;
  statsSchemaKey: string;
  stats: Record<string, unknown>;
}

/** A category set bound to a sport (named, optionally nested). */
export interface CatalogCategoryRow {
  id: string;
  sportId: string;
  parentCategoryId: string | null;
  slug: string;
}

/** Identity of an athlete from its external ids and aliases. */
export interface CatalogIdentityRow {
  athleteId: string;
  wikidataQid: string | null;
  nicknames: string[];
  externalIds: Record<string, string>;
  social: Record<string, string>;
}
