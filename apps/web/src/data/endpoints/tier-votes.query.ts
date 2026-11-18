import { AdminApi, ParticipationApi } from '@was/shared';

import { bySlug, defineMutation, defineQuery } from '../define-endpoint.helper';
import { requireUser } from '../fixtures/require-user.fixture';
import { buildTierVotes, castDemoVote, setDemoOfficialTier } from '../fixtures/tier-votes.fixture';
import { athleteProfileQuery, athletesQuery } from './athletes.query';
import { meQuery, sessionQuery } from './session.query';

/** GET /api/athletes/:slug/tier-votes (doc 17). Signed-in only: call with `{ enabled: isSignedIn }`. */
export const tierVotesQuery = defineQuery(ParticipationApi.tierVotes, {
  sample: ({ input, sample }) => buildTierVotes(sample, input.params.slug),
  empty: 'not-found',
});

/** PUT /api/athletes/:slug/tier-vote: create or change my vote. */
export const castTierVote = defineMutation(
  ParticipationApi.castTierVote,
  ({ input, session }) => castDemoVote(requireUser(session), input.params.slug, input.body.tier),
  // My vote changes the shares of that athlete only.
  { invalidates: [bySlug(tierVotesQuery), sessionQuery, meQuery] },
);

/** PATCH /api/admin/athletes/:slug/tier: official tier (reason required; Mythic needs an approved dossier). */
export const setOfficialTier = defineMutation(
  AdminApi.setOfficialTier,
  ({ input, sample }) => setDemoOfficialTier(sample, input.params.slug, input.body.tier, input.body.reason),
  { invalidates: [tierVotesQuery, athleteProfileQuery, athletesQuery] },
);
