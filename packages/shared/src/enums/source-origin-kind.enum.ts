/** Who produces the data of a source. */
export const SourceOriginKind = {
  Community: 'community',
  Historians: 'historians',
  Official: 'official',
  Proprietary: 'proprietary',
  Unknown: 'unknown',
} as const;
export type SourceOriginKind = (typeof SourceOriginKind)[keyof typeof SourceOriginKind];
export const SOURCE_ORIGIN_KIND_VALUES = Object.values(SourceOriginKind) as [SourceOriginKind, ...SourceOriginKind[]];
