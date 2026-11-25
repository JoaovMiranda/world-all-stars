// Legacy engine (handoff §11.5, D11): the L1–L5 readout of a competitor. It has no link to `runRanking`: it never
// changes a score, a position or a cross-sport band.
export {
  LEGACY_AWARD_KINDS,
  LEGACY_HONOR_POINTS,
  LEGACY_LEVELS,
  LEGACY_RULESET_VERSION,
  LEGACY_THRESHOLDS,
  LEGACY_TITLE_BY_LEVEL,
  LEGACY_TITLE_KINDS,
} from './legacy.const';
export { computeLegacyLevel } from './legacy.helper';
export { legacyEvidenceOf, legacyHonorOf } from './legacy-evidence.helper';
export type { LegacyHonor } from './legacy-honor.interface';
export type { LegacyInput } from './legacy-input.interface';
export type { LegacyLevel } from './legacy-level.type';
export type { LegacyResult } from './legacy-result.interface';
