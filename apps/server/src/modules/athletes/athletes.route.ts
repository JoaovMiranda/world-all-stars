import { PublicApi, composeCompare } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { notFound } from '../../http/http-error.error';

/** P2/P4 + analysis (doc 16): everything read from the catalog snapshot. */
export const athletesRoutes = [
  defineRoute(PublicApi.athletes, async ({ query }, { deps, locale }) => {
    const items = (await deps.catalog.get(locale)).athletes(query);
    return { items, total: items.length };
  }),
  defineRoute(PublicApi.athleteProfile, async ({ params }, { deps, locale }) => {
    const profile = (await deps.catalog.get(locale)).profile(params.slug);
    if (!profile) throw notFound();
    return profile;
  }),
  defineRoute(PublicApi.analysisDimensions, async (_, { deps, locale }) => (await deps.catalog.get(locale)).analysis()),
  defineRoute(PublicApi.compare, async ({ query }, { deps, locale }) => {
    const view = await deps.catalog.get(locale);
    return composeCompare(query.slugs, view.athletes(), view.analysis());
  }),
];
