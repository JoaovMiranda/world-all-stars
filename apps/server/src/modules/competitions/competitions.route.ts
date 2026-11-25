import { CompetitionsApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { CompetitionsController } from './competitions.controller';

/** Competition and edition pages (T4.1). */
export const competitionsRoutes = [
  defineRoute(CompetitionsApi.competition, (input, ctx) => new CompetitionsController(ctx).competition(input)),
  defineRoute(CompetitionsApi.edition, (input, ctx) => new CompetitionsController(ctx).edition(input)),
];
