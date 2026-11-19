/** What a methodology produces (§8.1): not every ranking is a number. */
export const RankingOutputKind = {
  Score: 'score',
  Ordinal: 'ordinal',
  Rating: 'rating',
  Bands: 'bands',
} as const;
export type RankingOutputKind = (typeof RankingOutputKind)[keyof typeof RankingOutputKind];
export const RANKING_OUTPUT_KIND_VALUES = Object.values(RankingOutputKind) as [RankingOutputKind, ...RankingOutputKind[]];
