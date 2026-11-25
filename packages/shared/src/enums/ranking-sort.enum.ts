/** Order of a ranking table (`?sort=`): by position (default) or by competitor name. Sort-only: not in the canonical. */
export const RankingSort = {
  Rank: 'rank',
  Name: 'name',
} as const;
export type RankingSort = (typeof RankingSort)[keyof typeof RankingSort];
export const RANKING_SORT_VALUES = Object.values(RankingSort) as [RankingSort, ...RankingSort[]];
