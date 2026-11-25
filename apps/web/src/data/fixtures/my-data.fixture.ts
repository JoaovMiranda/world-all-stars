import { CONSENT_PURPOSE_VALUES, ConsentPurpose, type DeleteAccountResponse, LEGAL_DOCUMENT_VERSIONS, LegalDocumentKind, type MyDataExport, type MyDataResponse, type SessionUser, accountDeleteConfirmationError, anonymizedUserName } from '@was/shared';

import { localeStore } from '@/i18n/locale.store';

import { ApiError } from '../api-error.error';
import { demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';
import { buildMyInteractions } from './interactions.fixture';
import { buildMe, buildNotifications } from './me.fixture';

/** Sign-up of the simulated accounts: Terms + Privacy accepted, notification e-mails opted in (doc 13). */
const SIGNED_UP_AT = '2026-10-01T12:00:00.000Z';
const DEFAULT_GRANTED: readonly ConsentPurpose[] = [ConsentPurpose.NotificationEmails];

/** GET /api/me/data (E6): acceptances of the current versions + consents overlaid by the demo choices. */
export const buildMyData = (): MyDataResponse => {
  const demo = demoStore.get().consents;
  return {
    acceptances: [LegalDocumentKind.Terms, LegalDocumentKind.Privacy].map((document) => ({
      document,
      version: LEGAL_DOCUMENT_VERSIONS[document].version,
      acceptedAt: SIGNED_UP_AT,
    })),
    consents: CONSENT_PURPOSE_VALUES.map((purpose) => {
      const choice = demo[purpose];
      return choice
        ? { purpose, granted: choice.granted, updatedAt: choice.at }
        : { purpose, granted: DEFAULT_GRANTED.includes(purpose), updatedAt: DEFAULT_GRANTED.includes(purpose) ? SIGNED_UP_AT : null };
    }),
  };
};

/** PUT /api/me/consents/:purpose. */
export const updateDemoConsent = (purpose: ConsentPurpose, granted: boolean) => {
  const at = new Date().toISOString();
  demoStore.update((d) => {
    d.consents[purpose] = { granted, at };
  });
  return { purpose, granted, updatedAt: at };
};

/** POST /api/me/export: everything tied to the account (portability, LGPD art. 18 V). */
export const buildMyDataExport = async (sample: typeof loadSample, user: SessionUser): Promise<MyDataExport> => {
  const [me, notifications, interactions] = await Promise.all([buildMe(sample, user), buildNotifications(sample, user), buildMyInteractions(sample)]);
  return { ...me, ...buildMyData(), notifications: notifications.items, interactions, exportedAt: new Date().toISOString() };
};

/** DELETE /api/me: anonymization (name → pseudonym, e-mail erased); comments and votes stay under the pseudonym. */
export const deleteDemoAccount = (confirmation: string): DeleteAccountResponse => {
  const invalid = accountDeleteConfirmationError(confirmation, localeStore.get());
  if (invalid) throw new ApiError(422, { error: 'validation', message: invalid, errors: { confirmation: invalid } });
  demoStore.update((d) => {
    d.consents = {};
    d.star = null;
    d.hearts = {};
  });
  return { pseudonym: anonymizedUserName(Date.now()) };
};
