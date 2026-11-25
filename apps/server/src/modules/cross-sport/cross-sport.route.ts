import { CrossSportApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { CrossSportController } from './cross-sport.controller';

/** Cross-sport bands (D07) and legacy levels (D11). Registered before `rankingsRoutes` so `/api/rankings/all-sports` wins over `/api/rankings/:id`. */
export const crossSportRoutes = [
  defineRoute(CrossSportApi.list, (input, ctx) => new CrossSportController(ctx).list(input)),
  defineRoute(CrossSportApi.methodology, (_input, ctx) => new CrossSportController(ctx).methodology()),
  defineRoute(CrossSportApi.athleteBand, (input, ctx) => new CrossSportController(ctx).athleteBand(input)),
  defineRoute(CrossSportApi.athleteLegacy, (input, ctx) => new CrossSportController(ctx).athleteLegacy(input)),
  defineRoute(CrossSportApi.unmapped, (_input, ctx) => new CrossSportController(ctx).unmapped()),
];
