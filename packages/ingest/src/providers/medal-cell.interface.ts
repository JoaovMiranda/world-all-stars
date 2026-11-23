import type { MEDAL_COLUMNS } from './medal-columns.const';

/** One medal cell of a "List of Olympic medalists in X" page (event × Games × medal). */
export interface MedalCell {
  event: string;
  year: number;
  medal: (typeof MEDAL_COLUMNS)[number];
  athletes: { name: string; link: string | null }[];
  country: string;
}
