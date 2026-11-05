import { AdminApi, ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { castTierVote, getTierVotes, setOfficialTier } from './tier-votes.service';

export const tierVotesRoutes = [
  defineRoute(ParticipationApi.tierVotes, ({ params }, ctx) => getTierVotes(ctx, ctx.user, params.slug)),
  defineRoute(ParticipationApi.castTierVote, ({ params, body }, ctx) => castTierVote(ctx, ctx.user, params.slug, body.tier), { rateLimit: 'vote' }),
  defineRoute(AdminApi.setOfficialTier, ({ params, body }, ctx) => setOfficialTier(ctx, params.slug, body)),
];
