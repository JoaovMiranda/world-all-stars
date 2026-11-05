import { PublicApi, composeCompare } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { notFound } from '../../http/http-error.error';

/** P2/P4 + analysis (doc 16): everything read from the catalog snapshot. */
export const athletesRoutes = [
  defineRoute(PublicApi.athletes, async ({ query }, { deps }) => {
    const items = (await deps.catalog.get()).athletes(query);
    return { items, total: items.length };
  }),
  defineRoute(PublicApi.athleteProfile, async ({ params }, { deps }) => {
    const profile = (await deps.catalog.get()).profile(params.slug);
    if (!profile) throw notFound();
    return profile;
  }),
  defineRoute(PublicApi.analysisDimensions, async (_, { deps }) => (await deps.catalog.get()).analysis()),
  defineRoute(PublicApi.compare, async ({ query }, { deps }) => {
    const view = await deps.catalog.get();
    return composeCompare(query.slugs, view.athletes(), view.analysis());
  }),
];
