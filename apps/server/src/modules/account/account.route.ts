import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { deleteAccount, exportMyData, getMyData, updateConsent } from './account.service';

export const accountRoutes = [
  defineRoute(ParticipationApi.myData, (_, ctx) => getMyData(ctx, ctx.user)),
  defineRoute(ParticipationApi.updateConsent, ({ params, body }, ctx) => updateConsent(ctx, ctx.user, params.purpose, body.granted)),
  defineRoute(ParticipationApi.exportMyData, (_, ctx) => exportMyData(ctx, ctx.user)),
  defineRoute(ParticipationApi.deleteAccount, ({ body }, ctx) => deleteAccount(ctx, ctx.user, body.confirmation)),
];
