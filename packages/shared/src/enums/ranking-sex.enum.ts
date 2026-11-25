/** Sex category of a ranking or a filter (competition category, as in the ranking scopes: `men` / `women`). */
export const RankingSex = {
  Men: 'men',
  Women: 'women',
} as const;
export type RankingSex = (typeof RankingSex)[keyof typeof RankingSex];
export const RANKING_SEX_VALUES = Object.values(RankingSex) as [RankingSex, ...RankingSex[]];
