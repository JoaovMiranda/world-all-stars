import { type Database, active, users } from '@was/db';
import { DEMO_SESSION_EMAILS, SESSION_KIND_VALUES, SessionKind, UserRole } from '@was/shared';
import { eq } from 'drizzle-orm';

import type { AuthProvider, AuthUser, SessionContext } from './auth-provider.type';

export const SESSION_HEADER = 'x-was-session';
export const SESSION_COOKIE = 'was_session';
const ANON: SessionContext = { kind: SessionKind.Anon, user: null };

const isKind = (v: string | undefined): v is SessionKind => !!v && SESSION_KIND_VALUES.includes(v as SessionKind);

export const loadAuthUser = async (db: Database, where: { email?: string; id?: string }): Promise<AuthUser | null> => {
  const [u] = await db
    .select()
    .from(users)
    .where(active(users, where.id ? eq(users.id, where.id) : eq(users.email, where.email ?? '')))
    .limit(1);
  return u
    ? { id: u.id, email: u.email, name: u.displayName, role: u.role, bannedAt: u.bannedAt, tierVotesCount: u.tierVotesCount, commentsCount: u.commentsCount }
    : null;
};

/**
 * DEV ONLY: the web sends `x-was-session: anon|reader|admin` (its session switcher); the kind maps to the demo
 * accounts of the seed (DEMO_SESSION_EMAILS). The effective kind follows the account role, so a demoted admin is a
 * reader. Missing account (empty database) = anonymous.
 */
export const createSimulatedAuthProvider = (db: Database): AuthProvider => ({
  name: 'simulated',
  async resolve(req) {
    const raw = req.header(SESSION_HEADER) ?? req.cookie(SESSION_COOKIE) ?? req.query('as');
    if (!isKind(raw) || raw === SessionKind.Anon) return ANON;
    const user = await loadAuthUser(db, { email: DEMO_SESSION_EMAILS[raw] });
    if (!user) return ANON;
    return { kind: user.role === UserRole.Admin ? SessionKind.Admin : SessionKind.Reader, user };
  },
});
