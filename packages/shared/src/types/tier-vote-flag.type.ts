import type { z } from 'zod';

import type { TierVoteFlagSchema } from '../schemas/tier-vote-flag.schema';

export type TierVoteFlag = z.infer<typeof TierVoteFlagSchema>;
