import { PublicApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { AthletesController } from './athletes.controller';

/** P2/P4 + analysis (doc 16): everything read from the catalog snapshot. */
export const athletesRoutes = [
  defineRoute(PublicApi.athletes, (input, ctx) => new AthletesController(ctx).athletes(input)),
  defineRoute(PublicApi.athleteProfile, (input, ctx) => new AthletesController(ctx).profile(input)),
  defineRoute(PublicApi.analysisDimensions, (_input, ctx) => new AthletesController(ctx).analysisDimensions()),
  defineRoute(PublicApi.compare, (input, ctx) => new AthletesController(ctx).compare(input)),
];
