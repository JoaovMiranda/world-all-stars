import type { CrossSportBand } from './cross-sport-band.type';

/** One row of the mapping table: a competitive fact of a sport maps to one band, optionally for a period. */
export interface CrossSportMapping {
  sport: string;
  kind: 'recognition' | 'result';
  value: string;
  band: CrossSportBand;
  fromYear?: number | null;
  toYear?: number | null;
  sourceNote?: string | null;
}
