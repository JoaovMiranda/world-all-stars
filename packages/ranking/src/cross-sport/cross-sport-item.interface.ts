import type { CrossSportBand } from './cross-sport-band.type';

/** One accepted competitive fact of a competitor, ready to be mapped to a band. */
export interface CrossSportItem {
  competitorId: string;
  sport: string;
  kind: 'recognition' | 'result';
  value: string;
  year: number | null;
  evidenceId: string;
}

export interface CrossSportEntry {
  competitorId: string;
  band: CrossSportBand;
  points: number;
  items: { evidenceId: string; band: CrossSportBand; points: number; value: string; year: number | null }[];
}
