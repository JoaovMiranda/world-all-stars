import { active, legalAcceptances, userConsents, users } from '@was/db';
import {
  ACCOUNT_DELETE_CONFIRMATION,
  CONSENT_PURPOSE_VALUES,
  type ConsentPurpose,
  type DeleteAccountResponse,
  type MyDataExport,
  type MyDataResponse,
  VALIDATION_MESSAGES,
  anonymizedUserName,
} from '@was/shared';
import { and, eq } from 'drizzle-orm';

import type { AuthUser } from '../../auth/auth-provider.type';
import type { RequestContext } from '../../http/app-context.type';
import { invalidFields } from '../../http/http-error.error';
import { getMe, getNotifications } from '../session/session.service';

/** GET /api/me/data (E6): Terms/Privacy acceptances + every optional purpose (never granted = false). */
export const getMyData = async ({ deps }: RequestContext, user: AuthUser): Promise<MyDataResponse> => {
  const [acceptances, consents] = await Promise.all([
    deps.db.select().from(legalAcceptances).where(active(legalAcceptances, eq(legalAcceptances.userId, user.id))),
    deps.db.select().from(userConsents).where(active(userConsents, eq(userConsents.userId, user.id))),
  ]);
  return {
    acceptances: acceptances.map((a) => ({ document: a.documentKind, version: a.documentVersion, acceptedAt: a.acceptedAt.toISOString() })),
    consents: CONSENT_PURPOSE_VALUES.map((purpose) => {
      const c = consents.find((x) => x.purpose === purpose);
      return { purpose, granted: c?.granted ?? false, updatedAt: c ? c.decidedAt.toISOString() : null };
    }),
  };
};

/** PUT /api/me/consents/:purpose. */
export const updateConsent = async ({ deps, actor }: RequestContext, user: AuthUser, purpose: ConsentPurpose, granted: boolean) => {
  const now = new Date();
  const [existing] = await deps.db.select().from(userConsents).where(active(userConsents, and(eq(userConsents.userId, user.id), eq(userConsents.purpose, purpose))));
  if (existing) await deps.repo.update(userConsents, existing.id, { granted, decidedAt: now }, actor, { summary: granted ? 'granted' : 'revoked' });
  else await deps.repo.insert(userConsents, { userId: user.id, purpose, granted, decidedAt: now }, actor);
  return { purpose, granted, updatedAt: now.toISOString() };
};

/** POST /api/me/export (LGPD portability). */
export const exportMyData = async (ctx: RequestContext, user: AuthUser): Promise<MyDataExport> => {
  const [me, notifications, data] = await Promise.all([getMe(ctx.deps, user), getNotifications(ctx.deps, user), getMyData(ctx, user)]);
  return { ...me, ...data, notifications: notifications.items, exportedAt: new Date().toISOString() };
};

/** DELETE /api/me: anonymization (doc 13): pseudonym + e-mail erased, account soft-deleted; comments/votes stay. */
export const deleteAccount = async ({ deps, actor }: RequestContext, user: AuthUser, confirmation: string): Promise<DeleteAccountResponse> => {
  if (confirmation.trim() !== ACCOUNT_DELETE_CONFIRMATION) {
    throw invalidFields({ confirmation: VALIDATION_MESSAGES.accountDeleteConfirmation(ACCOUNT_DELETE_CONFIRMATION) }, VALIDATION_MESSAGES.accountDeleteConfirmation(ACCOUNT_DELETE_CONFIRMATION));
  }
  const pseudonym = anonymizedUserName(Date.now());
  await deps.repo.transaction(async (repo) => {
    await repo.update(users, user.id, { displayName: pseudonym, email: `removed+${user.id}@anon.invalid`, avatarUrl: null }, actor, { summary: 'anonymized' });
    await repo.softDelete(users, user.id, actor, { summary: 'account deleted' });
  });
  return { pseudonym };
};
