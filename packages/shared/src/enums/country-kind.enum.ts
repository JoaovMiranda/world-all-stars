/** Kind of geopolitical entity (C05): historical entities are preserved, never converted. */
export const CountryKind = {
  Sovereign: 'sovereign',
  Historical: 'historical',
  Constituent: 'constituent',
  Territory: 'territory',
} as const;
export type CountryKind = (typeof CountryKind)[keyof typeof CountryKind];
export const COUNTRY_KIND_VALUES = Object.values(CountryKind) as [CountryKind, ...CountryKind[]];
