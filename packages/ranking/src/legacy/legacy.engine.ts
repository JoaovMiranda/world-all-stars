// Legacy engine (handoff §11.5, D11): the L1–L5 readout of a competitor. It has no link to `runRanking`: it never
// changes a score, a position or a cross-sport band.
export { LEGACY_HONOR_POINTS, LEGACY_LEVELS, LEGACY_RULESET_VERSION, LEGACY_THRESHOLDS } from './legacy.const';
export type { LegacyLevel } from './legacy-level.type';
export type { LegacyHonor } from './legacy-honor.interface';
export type { LegacyResult } from './legacy-result.interface';
export { computeLegacyLevel } from './legacy.helper';
