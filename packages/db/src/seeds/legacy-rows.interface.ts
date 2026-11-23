import type { BackfillRow } from '../types/backfill-row.type';

/**
 * Rows of the retired legacy model (achievements, awards, reigns, nationalities, teams, stats, sport categories and
 * the athletes' identity columns), camelCase, soft-deleted rows excluded. The prototype seed hands them to the
 * universal backfill, which writes the universal model only.
 */
export interface LegacyRows {
  /** Identity of each athlete: id, knownAs, fullName, nicknames, wikidataQid, externalIds, socialLinks. */
  athletes: BackfillRow[];
  achievements: BackfillRow[];
  awards: BackfillRow[];
  awardTranslations: BackfillRow[];
  awardEditions: BackfillRow[];
  titleReigns: BackfillRow[];
  athleteNationalities: BackfillRow[];
  athleteTeams: BackfillRow[];
  athleteStats: BackfillRow[];
  sportCategories: BackfillRow[];
  sportCategoryTranslations: BackfillRow[];
}
