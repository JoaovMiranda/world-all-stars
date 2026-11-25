import { z } from 'zod';

import { TIER_VOTE_FLAG_STATUS_VALUES } from '../enums/tier-vote-flag-status.enum';
import { AthleteRefSchema } from './athlete-summary.schema';

const count = z.number().int().nonnegative();

/** A1 · "Tier signals": an account flagged by the anomaly rule (T3.2), with the evidence the admin reviews. */
export const TierVoteFlagSchema = z.object({
  id: z.string().min(1),
  /** Display name of the account (the admin panel already lists accounts). */
  account: z.string().min(1),
  accountCreatedAt: z.iso.datetime(),
  /** Athlete of the burst (null when it left the catalog). */
  athlete: AthleteRefSchema.nullable(),
  /** Votes in the 1-hour window when the flag was raised. */
  burstVotes: count,
  /** Live tier votes of the account (all athletes): what the decision includes or excludes. */
  accountVotes: count,
  flaggedAt: z.iso.datetime(),
  status: z.enum(TIER_VOTE_FLAG_STATUS_VALUES),
  reviewNote: z.string().nullable(),
});
