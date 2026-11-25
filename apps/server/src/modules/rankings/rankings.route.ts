import { RankingsApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { RankingsController } from './rankings.controller';

/** Rankings (handoff v3 §8): public = published snapshots only; admin = calculate + two approvals to publish. */
export const rankingsRoutes = [
  defineRoute(RankingsApi.list, (input, ctx) => new RankingsController(ctx).list(input)),
  defineRoute(RankingsApi.detail, (input, ctx) => new RankingsController(ctx).detail(input)),
  defineRoute(RankingsApi.filterOptions, (input, ctx) => new RankingsController(ctx).filterOptions(input)),
  defineRoute(RankingsApi.methodologies, (_input, ctx) => new RankingsController(ctx).methodologies()),
  defineRoute(RankingsApi.athlete, (input, ctx) => new RankingsController(ctx).athlete(input)),
  defineRoute(RankingsApi.adminList, (_input, ctx) => new RankingsController(ctx).adminList()),
  defineRoute(RankingsApi.calculate, (input, ctx) => new RankingsController(ctx).calculate(input)),
  defineRoute(RankingsApi.approve, (input, ctx) => new RankingsController(ctx).approve(input)),
  defineRoute(RankingsApi.revert, (input, ctx) => new RankingsController(ctx).revert(input)),
];
