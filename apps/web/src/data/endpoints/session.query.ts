import { ParticipationApi } from '@was/shared';

import { demoStore } from '../demo.store';
import { defineMutation, defineQuery } from '../define-endpoint.helper';
import { buildMe, buildNotifications } from '../fixtures/me.fixture';
import { requireUser } from '../fixtures/require-user.fixture';

/** GET /api/session: the simulated session (same in every fixture mode). Fixtures have no Google and no consent step. */
export const sessionQuery = defineQuery(ParticipationApi.session, {
  sample: ({ session }) => ({ ...session, pendingConsent: null, simulated: true, googleEnabled: false }),
  modeIndependent: true,
});

/** GET /api/me (E2). */
export const meQuery = defineQuery(ParticipationApi.me, {
  sample: ({ sample, session }) => buildMe(sample, requireUser(session)),
  empty: ({ session }) => ({ user: requireUser(session), votes: [], comments: [] }),
});

/** GET /api/notifications (E4). */
export const notificationsQuery = defineQuery(ParticipationApi.notifications, {
  sample: ({ sample, session }) => buildNotifications(sample, requireUser(session)),
});

/** PATCH /api/notifications/:id/read. */
export const markNotificationRead = defineMutation(
  ParticipationApi.markNotificationRead,
  ({ input }) => {
    demoStore.update((d) => {
      if (!d.readNotifications.includes(input.params.id)) d.readNotifications.push(input.params.id);
    });
    return { ok: true };
  },
  { invalidates: [notificationsQuery] },
);
