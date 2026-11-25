// Rows of the competitions read model (aliased SQL columns of CompetitionsRepository).

export interface CompetitionRow {
  id: string;
  slug: string;
  name: string | null;
  nameLocale: string | null;
  isOlympic: boolean;
  isMultiSport: boolean;
  wikidataQid: string | null;
  updatedAt: Date | string;
  sportSlug: string | null;
  sportName: string | null;
  sportColor: string | null;
  orgSlug: string | null;
  orgName: string | null;
  level: string | null;
}

export interface EditionRow {
  id: string;
  year: number | null;
  label: string | null;
  number: number | null;
  startDate: string | null;
  endDate: string | null;
  status: string;
  updatedAt: Date | string;
  hostCountryId: string | null;
  hostCity: string | null;
}

export interface CompetitorRow {
  competitorId: string;
  kind: string;
  name: string;
  slug: string | null;
  nationId: string | null;
}

/** An entry (competitor in an event) of an edition. */
export interface EntryRow extends CompetitorRow {
  entryId: string;
  editionId: string;
  eventId: string | null;
}

export interface EventRow {
  id: string;
  label: string;
  category: string | null;
}

export interface ResultRow {
  eventId: string;
  entryId: string;
  rank: number | null;
  tied: boolean;
  status: string;
  mark: string | null;
}

export interface MemberRow {
  entryId: string;
  name: string;
  slug: string | null;
  role: string | null;
  position: string | null;
  shirtNumber: number | null;
}

export interface LineupRow {
  contestId: string;
  contest: string;
  date: string | null;
  eventId: string;
  entryId: string;
  name: string;
  slug: string | null;
  role: string;
}

export interface NationRow {
  id: string;
  code: string;
  name: string;
  flag: string | null;
}

export interface SourceLinkRow {
  url: string;
  slug: string | null;
  name: string | null;
  license: string | null;
  home: string | null;
}
