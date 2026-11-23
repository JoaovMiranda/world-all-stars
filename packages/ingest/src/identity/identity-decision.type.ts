import type { IdentityCandidate } from './identity-candidate.interface';

/** Outcome of identity resolution: automatic match, human review or a new person. */
export type IdentityDecision =
  | { kind: 'match'; entityId: string; confidence: number; signals: string[] }
  | { kind: 'review'; candidates: IdentityCandidate[] }
  | { kind: 'new' };
