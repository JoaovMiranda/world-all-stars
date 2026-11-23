import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { SessionController } from './session.controller';

export const sessionRoutes = [
  defineRoute(ParticipationApi.session, (_input, ctx) => new SessionController(ctx).session()),
  defineRoute(ParticipationApi.me, (_input, ctx) => new SessionController(ctx).me()),
  defineRoute(ParticipationApi.notifications, (_input, ctx) => new SessionController(ctx).notifications()),
  defineRoute(ParticipationApi.markNotificationRead, (input, ctx) => new SessionController(ctx).markNotificationRead(input)),
];
