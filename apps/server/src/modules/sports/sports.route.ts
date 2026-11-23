import { PublicApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { SportsController } from './sports.controller';

/** P6/P7 + governance models and the organization hierarchy (docs 18/19). */
export const sportsRoutes = [
  defineRoute(PublicApi.sports, (_input, ctx) => new SportsController(ctx).sports()),
  defineRoute(PublicApi.sportPage, (input, ctx) => new SportsController(ctx).sportPage(input)),
  defineRoute(PublicApi.governanceModels, (_input, ctx) => new SportsController(ctx).governanceModels()),
  defineRoute(PublicApi.organizations, (_input, ctx) => new SportsController(ctx).organizations()),
];
