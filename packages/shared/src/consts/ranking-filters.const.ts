import { RANKING_FILTER_KEY_VALUES, type RankingFilterKey } from '../enums/ranking-filter-key.enum';
import { RankingSort } from '../enums/ranking-sort.enum';
import {
  BjjRankingSearchSchema,
  BoxingRankingSearchSchema,
  ChessRankingSearchSchema,
  FootballRankingSearchSchema,
  IronmanRankingSearchSchema,
  OlympicRankingSearchSchema,
} from '../schemas/ranking-search.schema';

/** Typed URL state of /rankings/$id per methodology (T2.5): its filters + page + sort. */
export const RANKING_SEARCH_SCHEMAS = {
  'bjj-career': BjjRankingSearchSchema,
  'football-champions': FootballRankingSearchSchema,
  boxing: BoxingRankingSearchSchema,
  'olympic-medals': OlympicRankingSearchSchema,
  'chess-classical': ChessRankingSearchSchema,
  ironman: IronmanRankingSearchSchema,
};

/** Filters each methodology accepts, in display order; keys of other methodologies are ignored by the API and the page. */
export const RANKING_FILTER_KEYS_BY_METHODOLOGY: Readonly<Record<string, readonly RankingFilterKey[]>> = Object.fromEntries(
  Object.entries(RANKING_SEARCH_SCHEMAS).map(([methodology, schema]) => [
    methodology,
    Object.keys(schema.shape).filter((k): k is RankingFilterKey => (RANKING_FILTER_KEY_VALUES as readonly string[]).includes(k)),
  ]),
);

/** Search params that only reorder a page: dropped from the canonical URL. */
export const RANKING_SORT_ONLY_PARAMS = ['sort'] as const;

/** Default order of a ranking table. */
export const DEFAULT_RANKING_SORT = RankingSort.Rank;
