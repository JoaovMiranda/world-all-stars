import { z } from 'zod';

import { TIER_VALUES } from '../enums/tier.enum';

const tier = z.enum(TIER_VALUES);

/** Response of GET /api/athletes/:slug/tier-votes (doc 17). Counts are only sent to signed-in users. */
export const TierVotesResponseSchema = z.object({
  counts: z.record(tier, z.number().int().nonnegative()),
  total: z.number().int().nonnegative(),
  official: tier,
  myVote: tier.nullable(),
});
export type TierVotesResponse = z.infer<typeof TierVotesResponseSchema>;

/** Body of PUT /api/athletes/:slug/tier-vote (idempotent: create or change). */
export const CastTierVoteRequestSchema = z.object({ tier });
export type CastTierVoteRequest = z.infer<typeof CastTierVoteRequestSchema>;
export const CastTierVoteResponseSchema = z.object({ myVote: tier, userVotesCount: z.number().int().nonnegative() });
export type CastTierVoteResponse = z.infer<typeof CastTierVoteResponseSchema>;

/** Body of PATCH /api/admin/athletes/:slug/tier (reason mandatory; Mythic requires an approved dossier). */
export const SetOfficialTierRequestSchema = z.object({ tier, reason: z.string().trim().min(3) });
export type SetOfficialTierRequest = z.infer<typeof SetOfficialTierRequestSchema>;
export const SetOfficialTierResponseSchema = z.object({ official: tier });
