import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { AccountController } from './account.controller';

export const accountRoutes = [
  defineRoute(ParticipationApi.acceptConsent, (input, ctx) => new AccountController(ctx).acceptConsent(input), { rateLimit: 'vote' }),
  defineRoute(ParticipationApi.myData, (_input, ctx) => new AccountController(ctx).myData()),
  defineRoute(ParticipationApi.updateConsent, (input, ctx) => new AccountController(ctx).updateConsent(input)),
  defineRoute(ParticipationApi.exportMyData, (_input, ctx) => new AccountController(ctx).exportMyData()),
  defineRoute(ParticipationApi.deleteAccount, (input, ctx) => new AccountController(ctx).deleteAccount(input)),
];
