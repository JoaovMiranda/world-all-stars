import type { LEGACY_LEVELS } from './legacy.const';

/** A legacy level (D11); L0 means no accepted honor. */
export type LegacyLevel = (typeof LEGACY_LEVELS)[number] | 'L0';
