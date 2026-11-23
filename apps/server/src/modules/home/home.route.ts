import { PublicApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { HomeController } from './home.controller';

/** P1: one round trip, composed by the same shared function as the web fixtures (composeHome). */
export const homeRoutes = [defineRoute(PublicApi.home, (input, ctx) => new HomeController(ctx).home(input))];
