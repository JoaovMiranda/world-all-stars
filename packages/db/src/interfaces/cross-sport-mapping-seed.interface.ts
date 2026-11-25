/** One seeded cross-sport band mapping (§11.4): a recognition or result value of a sport → band S–D, with its rationale. */
export interface CrossSportMappingSeed {
  sport: string;
  kind: 'recognition' | 'result';
  value: string;
  band: 'S' | 'A' | 'B' | 'C' | 'D';
  note: string;
}
