/** Scope of a sport observance day. */
export const ObservanceScope = {
  World: 'world',
  National: 'national',
} as const;
export type ObservanceScope = (typeof ObservanceScope)[keyof typeof ObservanceScope];
export const OBSERVANCE_SCOPE_VALUES = Object.values(ObservanceScope) as [ObservanceScope, ...ObservanceScope[]];
