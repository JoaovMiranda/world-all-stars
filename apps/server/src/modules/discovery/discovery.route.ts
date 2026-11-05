import { PublicApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { getValidationContext } from '../moderation/validation-context.service';
import { listCollectionRuns } from './discovery.repository';

/** Hall of Greats, sources, collection runs, calendar, on this day, validation context. */
export const discoveryRoutes = [
  defineRoute(PublicApi.hallOfGreats, async (_, { deps }) => {
    const view = await deps.catalog.get();
    return { greats: view.hallOfGreats(), candidates: view.candidates() };
  }),
  defineRoute(PublicApi.sources, async (_, { deps }) => (await deps.catalog.get()).sourcesOverview()),
  defineRoute(PublicApi.collectionRuns, (_, { deps }) => listCollectionRuns(deps.db)),
  defineRoute(PublicApi.calendar, async ({ query }, { deps }) =>
    (await deps.catalog.get()).calendar(query.from, query.to).filter((e) => !query.sport || e.sport?.slug === query.sport),
  ),
  defineRoute(PublicApi.onThisDay, async ({ params }, { deps }) => (await deps.catalog.get()).onThisDay(params.md)),
  defineRoute(PublicApi.validationContext, (_, { deps }) => getValidationContext(deps)),
];
