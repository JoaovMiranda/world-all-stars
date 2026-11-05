import { ParticipationApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { getMe, getNotifications, getSession, markNotificationRead } from './session.service';

export const sessionRoutes = [
  defineRoute(ParticipationApi.session, (_, { session }) => getSession(session)),
  defineRoute(ParticipationApi.me, (_, { deps, user }) => getMe(deps, user)),
  defineRoute(ParticipationApi.notifications, (_, { deps, user }) => getNotifications(deps, user)),
  defineRoute(ParticipationApi.markNotificationRead, ({ params }, { deps, user, actor }) => markNotificationRead(deps, user, actor, params.id)),
];
