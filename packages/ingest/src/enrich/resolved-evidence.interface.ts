/** Evidence of one AI claim after resolution: the cited sentence ID (when it was an ID) and the literal quote. */
export interface ResolvedEvidence {
  id: string | null;
  /** Exact text of SOURCE/FACTS, or null when the evidence matches nothing. */
  quote: string | null;
}
