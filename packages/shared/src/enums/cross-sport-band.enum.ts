/** Cross-sport bands (D07), strongest first: S=10, A=8, B=5, C=2, D=0.5 points, no caps. */
export const CrossSportBand = {
  S: 'S',
  A: 'A',
  B: 'B',
  C: 'C',
  D: 'D',
} as const;
export type CrossSportBand = (typeof CrossSportBand)[keyof typeof CrossSportBand];
export const CROSS_SPORT_BAND_VALUES = Object.values(CrossSportBand) as [CrossSportBand, ...CrossSportBand[]];
