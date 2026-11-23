import { active, authSessions, type Database, legalAcceptances, users } from '@was/db';
import { LEGAL_DOCUMENT_VERSIONS, REQUIRED_LEGAL_DOCUMENTS, SessionKind, UserRole } from '@was/shared';
import { and, eq, inArray } from 'drizzle-orm';

import type { AuthUser, SessionContext, SessionSource } from './auth-provider.type';
import { ANON_SESSION } from './auth-user.const';

/** Live account by id or e-mail, in the shape the API needs (shared by every provider and the session service). */
export const loadAuthUser = async (db: Database, where: { email?: string; id?: string }): Promise<AuthUser | null> => {
  const [u] = await db
    .select()
    .from(users)
    .where(active(users, where.id ? eq(users.id, where.id) : eq(users.email, where.email ?? '')))
    .limit(1);
  return u
    ? {
        id: u.id,
        email: u.email,
        name: u.displayName,
        avatarUrl: u.avatarUrl,
        role: u.role,
        emailVerified: u.emailVerified,
        bannedAt: u.bannedAt,
        tierVotesCount: u.tierVotesCount,
        commentsCount: u.commentsCount,
      }
    : null;
};

/** True when the account accepted the CURRENT version of every required document (Terms + Privacy, doc 13). */
export const hasCurrentConsent = async (db: Database, userId: string): Promise<boolean> => {
  const rows = await db
    .select({ kind: legalAcceptances.documentKind, version: legalAcceptances.documentVersion })
    .from(legalAcceptances)
    .where(active(legalAcceptances, and(eq(legalAcceptances.userId, userId), inArray(legalAcceptances.documentKind, [...REQUIRED_LEGAL_DOCUMENTS]))));
  return REQUIRED_LEGAL_DOCUMENTS.every((kind) => rows.some((r) => r.kind === kind && r.version === LEGAL_DOCUMENT_VERSIONS[kind].version));
};

/**
 * Session of a resolved account: pending (= anonymous) until the current Terms/Privacy are accepted, else reader or
 * admin by role. Same rule for Better Auth and the simulated switcher.
 */
export const accountSession = async (db: Database, user: AuthUser, source: SessionSource, consent?: boolean): Promise<SessionContext> => {
  if (!(consent ?? (await hasCurrentConsent(db, user.id)))) return { ...ANON_SESSION, pending: user, source };
  return { kind: user.role === UserRole.Admin ? SessionKind.Admin : SessionKind.Reader, user, pending: null, source };
};

/** Session of an account id (Better Auth): the user row and its consent are read in parallel (one round-trip). */
export const sessionForUserId = async (db: Database, userId: string, source: SessionSource): Promise<SessionContext> => {
  const [user, consent] = await Promise.all([loadAuthUser(db, { id: userId }), hasCurrentConsent(db, userId)]);
  return user ? accountSession(db, user, source, consent) : ANON_SESSION;
};

/** Signs the account out of every browser (Better Auth sessions are ephemeral rows: physical DELETE allowed). */
export const revokeAuthSessions = (db: Database, userId: string) => db.delete(authSessions).where(eq(authSessions.userId, userId));
