/** An existing person scored against an identity query. */
export interface IdentityCandidate {
  entityId: string;
  confidence: number;
  signals: string[];
}
