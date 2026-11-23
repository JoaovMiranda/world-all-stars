import { PublicApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { DiscoveryController } from './discovery.controller';

/** Hall of Greats, sources, collection runs, calendar, on this day, validation context. */
export const discoveryRoutes = [
  defineRoute(PublicApi.hallOfGreats, (_input, ctx) => new DiscoveryController(ctx).hallOfGreats()),
  defineRoute(PublicApi.sources, (_input, ctx) => new DiscoveryController(ctx).sources()),
  defineRoute(PublicApi.collectionRuns, (_input, ctx) => new DiscoveryController(ctx).collectionRuns()),
  defineRoute(PublicApi.calendar, (input, ctx) => new DiscoveryController(ctx).calendar(input)),
  defineRoute(PublicApi.onThisDay, (input, ctx) => new DiscoveryController(ctx).onThisDay(input)),
  defineRoute(PublicApi.validationContext, (_input, ctx) => new DiscoveryController(ctx).validationContext()),
];
