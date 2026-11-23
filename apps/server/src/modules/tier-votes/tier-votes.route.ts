import { AdminApi, ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { TierVotesController } from './tier-votes.controller';

export const tierVotesRoutes = [
  defineRoute(ParticipationApi.tierVotes, (input, ctx) => new TierVotesController(ctx).tierVotes(input)),
  defineRoute(ParticipationApi.castTierVote, (input, ctx) => new TierVotesController(ctx).castTierVote(input), { rateLimit: 'vote' }),
  defineRoute(AdminApi.setOfficialTier, (input, ctx) => new TierVotesController(ctx).setOfficialTier(input)),
];
