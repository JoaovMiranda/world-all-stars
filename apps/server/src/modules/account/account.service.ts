import { active, authAccounts, legalAcceptances, userConsents, users } from '@was/db';
import {
  type AcceptConsentRequest,
  AuthAuditAction,
  CONSENT_PURPOSE_VALUES,
  LEGAL_DOCUMENT_VERSIONS,
  LegalDocumentKind,
  type ConsentPurpose,
  type DeleteAccountResponse,
  type MyDataExport,
  type MyDataResponse,
  ApiErrorCode,
  accountDeleteConfirmationError,
  anonymizedUserName,
} from '@was/shared';
import { and, eq } from 'drizzle-orm';

import type { AuthUser } from '../../auth/auth-provider.type';
import { revokeAuthSessions } from '../../auth/auth-user.helper';
import type { RequestContext } from '../../http/app-context.type';
import { httpError, unprocessable } from '../../http/http-error.error';
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

/**
 * POST /api/account/consent (doc 13): a signed-in account whose Terms/Privacy are outdated (pending session) accepts
 * the versions shown in the dialog + declares 18+. Versions must be the CURRENT ones (409 otherwise: the page is
 * stale). One legal_acceptances row per document (terms, privacy, age_declaration) with the ip_hash; idempotent.
 */
export const acceptConsent = async ({ deps, session, ipHash, actor }: RequestContext, body: AcceptConsentRequest) => {
  const user = session.pending;
  if (!user) throw httpError(session.user ? 409 : 401, session.user ? ApiErrorCode.ConsentOutdated : ApiErrorCode.Auth, session.user ? 'consentNotPending' : 'signIn');
  if (body.termsVersion !== LEGAL_DOCUMENT_VERSIONS.terms.version || body.privacyVersion !== LEGAL_DOCUMENT_VERSIONS.privacy.version) {
    throw httpError(409, ApiErrorCode.ConsentOutdated, 'consentOutdated');
  }
  const now = new Date();
  const who = { ...actor, userId: user.id, name: user.name };
  const accepted = [
    [LegalDocumentKind.Terms, body.termsVersion],
    [LegalDocumentKind.Privacy, body.privacyVersion],
    [LegalDocumentKind.AgeDeclaration, LEGAL_DOCUMENT_VERSIONS.age_declaration.version],
  ] as const;
  await deps.repo.transaction(async (repo) => {
    for (const [documentKind, documentVersion] of accepted) {
      await repo.ensure(legalAcceptances, { userId: user.id, documentKind, documentVersion }, { userId: user.id, documentKind, documentVersion, acceptedAt: now, ipHash }, who);
    }
    await repo.audit(who, AuthAuditAction.ConsentAccepted, { type: 'users', id: user.id }, { terms: body.termsVersion, privacy: body.privacyVersion, adult: true, actorName: user.name });
  });
  return { ok: true as const };
};

/** POST /api/me/export (LGPD portability). */
export const exportMyData = async (ctx: RequestContext, user: AuthUser): Promise<MyDataExport> => {
  const [me, notifications, data] = await Promise.all([getMe(ctx.deps, user), getNotifications(ctx.deps, user), getMyData(ctx, user)]);
  return { ...me, ...data, notifications: notifications.items, exportedAt: new Date().toISOString() };
};

/** DELETE /api/me: anonymization (doc 13): pseudonym + e-mail erased, account soft-deleted; comments/votes stay. */
export const deleteAccount = async ({ deps, actor, locale }: RequestContext, user: AuthUser, confirmation: string): Promise<DeleteAccountResponse> => {
  const invalid = accountDeleteConfirmationError(confirmation, locale);
  if (invalid) throw unprocessable(ApiErrorCode.Validation, invalid, { confirmation: invalid });
  const pseudonym = anonymizedUserName(Date.now());
  await deps.repo.transaction(async (repo) => {
    await repo.update(users, user.id, { displayName: pseudonym, email: `removed+${user.id}@anon.invalid`, avatarUrl: null }, actor, { summary: 'anonymized' });
    await repo.softDelete(users, user.id, actor, { summary: 'account deleted' });
    // Ephemeral Better Auth rows (exempt from forbid_delete): every browser is signed out, the Google link is gone.
    await revokeAuthSessions(repo.db, user.id);
    await repo.db.delete(authAccounts).where(eq(authAccounts.userId, user.id));
  });
  return { pseudonym };
};
