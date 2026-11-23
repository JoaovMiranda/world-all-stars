import type { MergeCandidate, MergeFieldWinner } from '@was/shared';

import type { MergeSelection } from './admin-merge-selection.interface';

/** Nothing picked yet. */
export const emptyMergeSelection = (): MergeSelection => ({ survivor: null, merged: null, choices: {} });

/**
 * Picks one side. Picking on one side the entity already on the other side swaps them; any change of the pair
 * resets the field choices (they belonged to the previous pair).
 */
export const pickMergeSide = (state: MergeSelection, side: MergeFieldWinner, candidate: MergeCandidate | null): MergeSelection => {
  const other = side === 'survivor' ? state.merged : state.survivor;
  if (candidate && other?.id === candidate.id) return swapMergeSides({ ...state, choices: {} });
  return { ...state, [side]: candidate, choices: {} };
};

/** Swaps A and B; each chosen value stays chosen (its winner flips with the swap). */
export const swapMergeSides = (state: MergeSelection): MergeSelection => ({
  survivor: state.merged,
  merged: state.survivor,
  choices: Object.fromEntries(Object.entries(state.choices).map(([field, winner]) => [field, winner === 'survivor' ? 'merged' : 'survivor'])),
});

/** Sets the winner of one field. */
export const chooseMergeField = (state: MergeSelection, field: string, winner: MergeFieldWinner): MergeSelection => ({
  ...state,
  choices: { ...state.choices, [field]: winner },
});

/** Winner shown for a field (the survivor by default). */
export const mergeWinnerOf = (state: MergeSelection, field: string): MergeFieldWinner => state.choices[field] ?? 'survivor';

/** Both sides picked and different: the comparison can be loaded and the merge confirmed. */
export const isMergeReady = (state: MergeSelection): state is MergeSelection & { survivor: MergeCandidate; merged: MergeCandidate } =>
  Boolean(state.survivor && state.merged && state.survivor.id !== state.merged.id);

/** Request body of the merge (only the fields where B wins need to travel). */
export const mergeRequestOf = (state: MergeSelection & { survivor: MergeCandidate; merged: MergeCandidate }, reason: string) => ({
  survivorId: state.survivor.id,
  mergedId: state.merged.id,
  reason,
  fieldChoices: Object.fromEntries(Object.entries(state.choices).filter(([, winner]) => winner === 'merged')),
});
