import type { CrossSportBand } from './cross-sport-band.type';

/** Cross-sport ruleset (D07): bands S–D, no caps. Points are a bounded readout, never a claim that one sport is better. */
export const CROSS_SPORT_BANDS = { S: 10, A: 8, B: 5, C: 2, D: 0.5 } as const;
export const CROSS_SPORT_RULESET_VERSION = 'cross-sport@1';
/** Highest first: the band of a competitor is the strongest band among its mapped items. */
export const CROSS_SPORT_BAND_ORDER: readonly CrossSportBand[] = ['S', 'A', 'B', 'C', 'D'];

/** Recognition kinds that are competitive facts: each one must map to a band or become an admin review item. */
export const CROSS_SPORT_COMPETITIVE_KINDS: readonly string[] = ['championship_title', 'belt_title', 'medal', 'runner_up'];

/** Sport key of the Olympic medal mappings: a medal of any Olympic sport maps through the same rows (§11.4). */
export const CROSS_SPORT_OLYMPIC_SPORT = 'multi-sport';
