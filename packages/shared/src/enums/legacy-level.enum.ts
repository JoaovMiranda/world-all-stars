/** Legacy levels (D11): L0 = no accepted honor; L1 Recognized … L4 Historic; L5 Foundational needs an approved dossier. */
export const LegacyLevel = {
  L0: 'L0',
  L1: 'L1',
  L2: 'L2',
  L3: 'L3',
  L4: 'L4',
  L5: 'L5',
} as const;
export type LegacyLevel = (typeof LegacyLevel)[keyof typeof LegacyLevel];
export const LEGACY_LEVEL_VALUES = Object.values(LegacyLevel) as [LegacyLevel, ...LegacyLevel[]];
