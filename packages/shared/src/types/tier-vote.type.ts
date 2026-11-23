import type { z } from 'zod';

import type { CastTierVoteRequestSchema, CastTierVoteResponseSchema, SetOfficialTierRequestSchema, TierVotesResponseSchema } from '../schemas/tier-vote.schema';

export type TierVotesResponse = z.infer<typeof TierVotesResponseSchema>;
export type CastTierVoteRequest = z.infer<typeof CastTierVoteRequestSchema>;
export type CastTierVoteResponse = z.infer<typeof CastTierVoteResponseSchema>;
export type SetOfficialTierRequest = z.infer<typeof SetOfficialTierRequestSchema>;
