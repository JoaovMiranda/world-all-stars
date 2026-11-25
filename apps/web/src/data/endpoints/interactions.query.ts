import { InteractionsApi } from '@was/shared';

import { defineMutation, defineQuery } from '../define-endpoint.helper';
import { buildMyInteractions, clearDemoStar, setDemoHeart, setDemoStar } from '../fixtures/interactions.fixture';
import { requireUser } from '../fixtures/require-user.fixture';

/**
 * GET /api/me/interactions: my star and hearts (D03, private). Signed-in only and never prefetched by a loader, so it
 * is fetched in the browser and never lands in the server-rendered (cacheable) HTML: call with `{ enabled: isSignedIn }`.
 */
export const myInteractionsQuery = defineQuery(InteractionsApi.myInteractions, {
  sample: ({ sample, session }) => {
    requireUser(session);
    return buildMyInteractions(sample);
  },
});

/** PUT /api/athletes/:slug/star: gives my only star to this athlete (moves it from the previous one). */
export const setStar = defineMutation(
  InteractionsApi.setStar,
  ({ input, sample, session }) => {
    requireUser(session);
    return setDemoStar(sample, input.params.slug);
  },
  { invalidates: [myInteractionsQuery] },
);

/** DELETE /api/athletes/:slug/star: takes my star back from this athlete. */
export const clearStar = defineMutation(
  InteractionsApi.clearStar,
  ({ input, sample, session }) => {
    requireUser(session);
    return clearDemoStar(sample, input.params.slug);
  },
  { invalidates: [myInteractionsQuery] },
);

/** PUT /api/athletes/:slug/heart: hearts or un-hearts this athlete (desired state in the body). */
export const toggleHeart = defineMutation(
  InteractionsApi.toggleHeart,
  ({ input, sample, session }) => {
    requireUser(session);
    return setDemoHeart(sample, input.params.slug, input.body.hearted);
  },
  { invalidates: [myInteractionsQuery] },
);
