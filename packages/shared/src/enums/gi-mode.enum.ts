/** Jiu-Jitsu rule set of a division: with the kimono (gi) or without it (no-gi). Slugs of the `gi_mode` dimension. */
export const GiMode = {
  Gi: 'gi',
  NoGi: 'no-gi',
} as const;
export type GiMode = (typeof GiMode)[keyof typeof GiMode];
export const GI_MODE_VALUES = Object.values(GiMode) as [GiMode, ...GiMode[]];
