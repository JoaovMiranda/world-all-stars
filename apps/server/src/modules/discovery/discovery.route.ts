import { PublicApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { getValidationContext } from '../moderation/validation-context.service';
import { listCollectionRuns } from './discovery.repository';

/** Hall of Greats, sources, collection runs, calendar, on this day, validation context. */
export const discoveryRoutes = [
  defineRoute(PublicApi.hallOfGreats, async (_, { deps, locale }) => {
    const view = await deps.catalog.get(locale);
    return { greats: view.hallOfGreats(), candidates: view.candidates(), contentLocale: view.hallContentLocale() };
  }),
  defineRoute(PublicApi.sources, async (_, { deps, locale }) => (await deps.catalog.get(locale)).sourcesOverview()),
  defineRoute(PublicApi.collectionRuns, (_, { deps }) => listCollectionRuns(deps.db)),
  defineRoute(PublicApi.calendar, async ({ query }, { deps, locale }) =>
    (await deps.catalog.get(locale)).calendar(query.from, query.to).filter((e) => !query.sport || e.sport?.slug === query.sport),
  ),
  defineRoute(PublicApi.onThisDay, async ({ params }, { deps, locale }) => (await deps.catalog.get(locale)).onThisDay(params.md)),
  defineRoute(PublicApi.validationContext, (_, { deps, locale }) => getValidationContext(deps, locale)),
];
