import type { MergeCandidate, MergeFieldWinner } from '@was/shared';

/** State of the merge screen: the two sides (A survives, B is merged into it) and the winner of each field. */
export interface MergeSelection {
  survivor: MergeCandidate | null;
  merged: MergeCandidate | null;
  /** Field → winning side; a field not listed keeps the survivor's value. */
  choices: Record<string, MergeFieldWinner>;
}
