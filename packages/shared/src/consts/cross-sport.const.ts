import { CrossSportBand } from '../enums/cross-sport-band.enum';
import { CrossSportEra } from '../enums/cross-sport-era.enum';

/** Points of each band (D07, ruleset `cross-sport@1`); the engine in @was/ranking uses the same values. */
export const CROSS_SPORT_BAND_POINTS: Readonly<Record<CrossSportBand, number>> = {
  [CrossSportBand.S]: 10,
  [CrossSportBand.A]: 8,
  [CrossSportBand.B]: 5,
  [CrossSportBand.C]: 2,
  [CrossSportBand.D]: 0.5,
};

/** Inclusive year range of each era filter (`to: null` = open). */
export const CROSS_SPORT_ERA_RANGES: Readonly<Record<CrossSportEra, { from: number | null; to: number | null }>> = {
  [CrossSportEra.Until1949]: { from: null, to: 1949 },
  [CrossSportEra.From1950To1969]: { from: 1950, to: 1969 },
  [CrossSportEra.From1970To1989]: { from: 1970, to: 1989 },
  [CrossSportEra.From1990To2009]: { from: 1990, to: 2009 },
  [CrossSportEra.Since2010]: { from: 2010, to: null },
};

/** Competitors per page of `/rankings/all-sports`. */
export const CROSS_SPORT_PAGE_SIZE = 60;
