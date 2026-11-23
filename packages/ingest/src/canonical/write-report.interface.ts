/** Counts of one canonical write pass. */
export interface WriteReport {
  observations: number;
  people: { created: number; matched: number; review: number };
  grants: number;
  entries: number;
  results: number;
  starters: number;
}
