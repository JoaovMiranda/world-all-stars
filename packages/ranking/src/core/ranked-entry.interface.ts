import type { ComputedEntry } from './computed-entry.interface';

export interface RankedEntry extends ComputedEntry {
  rank: number | null;
  rankTied: boolean;
}
