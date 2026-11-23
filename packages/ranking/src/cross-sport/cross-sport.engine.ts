// Cross-sport engine (handoff §11.4, D07): a bounded comparison readout. It never declares one sport better than
// another and it never invents a mapping: an unmapped fact is a typed error and an admin review item.
export { CROSS_SPORT_BANDS, CROSS_SPORT_BAND_ORDER, CROSS_SPORT_RULESET_VERSION } from './cross-sport.const';
export type { CrossSportBand } from './cross-sport-band.type';
export type { CrossSportEntry, CrossSportItem } from './cross-sport-item.interface';
export type { CrossSportMapping } from './cross-sport-mapping.interface';
export { calculateCrossSportBands, findCrossSportMapping, groupByBand, unmappedCrossSportItems } from './cross-sport.helper';
export { UnmappedRecognitionError } from './unmapped-recognition.error';
