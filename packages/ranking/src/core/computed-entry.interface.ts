export interface ComputedEntry {
  competitorId: string;
  eligible: boolean;
  eligibilityReason: string | null;
  score: number | null;
  band: string | null;
  metrics: Record<string, number>;
  items: { evidenceId: string; contribution: number; note: string | null }[];
  /** Comparison key, most significant first: higher numbers rank first; ties share the position. */
  sortKey: number[];
}
