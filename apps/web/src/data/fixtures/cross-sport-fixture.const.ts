import type { CrossSportBand } from '@was/shared';

/**
 * Fixture-mode subset of the `cross-sport@1` mapping rows (the real rows live in the database seed): competition
 * slug → band for titles, and the Olympic medal levels. Anything else is "unmapped" in the demo too.
 */
export const FIXTURE_TITLE_BANDS: Readonly<Record<string, Readonly<Record<string, CrossSportBand>>>> = {
  football: { 'fifa-world-cup': 'S', 'fifa-womens-world-cup': 'S', 'copa-america': 'A', 'uefa-euro': 'A' },
  'jiu-jitsu': { adcc: 'S', 'ibjjf-world-championship': 'S' },
  chess: { 'world-chess-championship': 'S', 'world-rapid-chess-championship': 'A', 'world-blitz-chess-championship': 'B' },
  ironman: { 'ironman-world-championship': 'S' },
};
export const FIXTURE_OLYMPIC_BANDS: Readonly<Record<string, CrossSportBand>> = { gold: 'S', silver: 'A', bronze: 'B' };

/** Legacy honor points and level thresholds of `legacy@1` (mirrored for the demo; the server uses @was/ranking). */
export const FIXTURE_LEGACY_POINTS: Readonly<Record<string, number>> = { world: 10, continental: 6, national: 3, award: 4 };
export const FIXTURE_LEGACY_THRESHOLDS: readonly [level: 'L1' | 'L2' | 'L3' | 'L4', min: number][] = [
  ['L4', 60],
  ['L3', 40],
  ['L2', 20],
  ['L1', 1],
];
export const FIXTURE_L5_THRESHOLD = 80;
