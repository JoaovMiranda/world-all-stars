import type { RankingCategoryFact } from './ranking-category-fact.interface';
import type { RankingCountryFact } from './ranking-country-fact.interface';

/** What one counted piece of evidence (result, squad membership) says about its competition, edition and category. */
export interface RankingItemFact {
  competition: string | null;
  competitionName: string | null;
  organization: string | null;
  organizationName: string | null;
  edition: number | null;
  sport: string | null;
  sportName: string | null;
  /** Position of the squad member in that entry (football). */
  position: string | null;
  positionName: string | null;
  /** Country the entry represented (NOC of an Olympic entry, national team). */
  country: RankingCountryFact | null;
  categories: RankingCategoryFact[];
}
