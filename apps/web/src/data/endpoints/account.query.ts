import { ParticipationApi } from '@was/shared';

import { defineMutation, defineQuery } from '../define-endpoint.helper';
import { requireUser } from '../fixtures/require-user.fixture';
import { buildMyData, buildMyDataExport, deleteDemoAccount, updateDemoConsent } from '../fixtures/my-data.fixture';
import { myInteractionsQuery } from './interactions.query';
import { meQuery, notificationsQuery, sessionQuery } from './session.query';

/** GET /api/me/data (E6): Terms/Privacy acceptances and optional consents. */
export const myDataQuery = defineQuery(ParticipationApi.myData, { sample: () => buildMyData() });

/** PUT /api/me/consents/:purpose: grant or revoke an optional consent. */
export const updateConsent = defineMutation(ParticipationApi.updateConsent, ({ input }) => updateDemoConsent(input.params.purpose, input.body.granted), {
  invalidates: [myDataQuery],
});

/** POST /api/me/export: the account data as JSON (the page turns it into a download). */
export const exportMyData = defineMutation(ParticipationApi.exportMyData, ({ sample, session }) => buildMyDataExport(sample, requireUser(session)));

/** DELETE /api/me: anonymizes the account (doc 13). */
export const deleteAccount = defineMutation(ParticipationApi.deleteAccount, ({ input }) => deleteDemoAccount(input.body.confirmation), {
  invalidates: [meQuery, notificationsQuery, myDataQuery, myInteractionsQuery],
});

/** POST /api/account/consent: a pending Google sign-in accepts the current Terms + Privacy and declares 18+. */
export const acceptConsent = defineMutation(ParticipationApi.acceptConsent, () => ({ ok: true as const }), {
  invalidates: [sessionQuery, myDataQuery],
});
