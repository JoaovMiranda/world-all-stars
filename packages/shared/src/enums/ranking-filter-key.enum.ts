/** URL filters of a ranking table (T2.5). Each methodology accepts a subset (RANKING_FILTER_KEYS_BY_METHODOLOGY). */
export const RankingFilterKey = {
  Sex: 'sex',
  Gi: 'gi',
  Belt: 'belt',
  Weight: 'weight',
  Absolute: 'absolute',
  Country: 'country',
  Organization: 'organization',
  Gender: 'gender',
  Competition: 'competition',
  Nationality: 'nationality',
  Edition: 'edition',
  Position: 'position',
  Division: 'division',
  Sport: 'sport',
  Season: 'season',
  Noc: 'noc',
} as const;
export type RankingFilterKey = (typeof RankingFilterKey)[keyof typeof RankingFilterKey];
export const RANKING_FILTER_KEY_VALUES = Object.values(RankingFilterKey) as [RankingFilterKey, ...RankingFilterKey[]];
