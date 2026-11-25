import type { RankingCountryFact } from './ranking-country-fact.interface';
import type { RankingItemFact } from './ranking-item-fact.interface';

/** Filterable facts of one ranking entry: the competitor's own attributes and those of each counted evidence. */
export interface RankingEntryFacts {
  /** Documented gender of the person (`male` / `female`), null for teams or unknown. */
  gender: string | null;
  countries: RankingCountryFact[];
  /** Positions recorded for the person in the sport (athlete_sports). */
  positions: string[];
  items: RankingItemFact[];
}
