import { TIER_VALUES, type Tier } from '../enums/tier.enum';

/** Vote counts of an athlete with every tier present (0 when nobody voted for it, doc 17). */
export const tierVoteCounts = (votes: readonly Tier[]): Record<Tier, number> => {
  const counts = Object.fromEntries(TIER_VALUES.map((t) => [t, 0])) as Record<Tier, number>;
  for (const t of votes) counts[t] += 1;
  return counts;
};
