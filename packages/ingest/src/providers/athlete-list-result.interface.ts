/** Outcome of resolving an athlete list against English Wikipedia. */
export interface AthleteListResult {
  resolved: number;
  /** Article titles of the resolved lines. */
  titles: string[];
  /** Lines without an unambiguous article (never guessed). */
  missing: string[];
}
