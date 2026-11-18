import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { acceptConsent, deleteAccount, exportMyData, getMyData, updateConsent } from './account.service';

export const accountRoutes = [
  defineRoute(ParticipationApi.acceptConsent, ({ body }, ctx) => acceptConsent(ctx, body), { rateLimit: 'vote' }),
  defineRoute(ParticipationApi.myData, (_, ctx) => getMyData(ctx, ctx.user)),
  defineRoute(ParticipationApi.updateConsent, ({ params, body }, ctx) => updateConsent(ctx, ctx.user, params.purpose, body.granted)),
  defineRoute(ParticipationApi.exportMyData, (_, ctx) => exportMyData(ctx, ctx.user)),
  defineRoute(ParticipationApi.deleteAccount, ({ body }, ctx) => deleteAccount(ctx, ctx.user, body.confirmation)),
];
