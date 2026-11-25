import { InteractionsApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { InteractionsController } from './interactions.controller';

export const interactionsRoutes = [
  defineRoute(InteractionsApi.myInteractions, (_input, ctx) => new InteractionsController(ctx).myInteractions()),
  defineRoute(InteractionsApi.setStar, (input, ctx) => new InteractionsController(ctx).setStar(input), { rateLimit: 'interactions' }),
  defineRoute(InteractionsApi.clearStar, (input, ctx) => new InteractionsController(ctx).clearStar(input), { rateLimit: 'interactions' }),
  defineRoute(InteractionsApi.toggleHeart, (input, ctx) => new InteractionsController(ctx).toggleHeart(input), { rateLimit: 'interactions' }),
];
