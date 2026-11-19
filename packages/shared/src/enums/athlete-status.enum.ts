/** Career status of an athlete. */
export const AthleteStatus = {
  Active: 'active',
  Retired: 'retired',
  Deceased: 'deceased',
  /** Not documented yet (new athletes from ingestion before Wikidata/Wikipedia confirm it). */
  Unknown: 'unknown',
} as const;
export type AthleteStatus = (typeof AthleteStatus)[keyof typeof AthleteStatus];
export const ATHLETE_STATUS_VALUES = Object.values(AthleteStatus) as [AthleteStatus, ...AthleteStatus[]];
