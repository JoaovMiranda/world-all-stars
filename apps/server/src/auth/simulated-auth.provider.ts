import type { Database } from '@was/db';
import { APP_COOKIE, DEMO_SESSION_EMAILS, HTTP_HEADER, SESSION_KIND_VALUES, SessionKind } from '@was/shared';

import type { AuthProvider } from './auth-provider.type';
import { ANON_SESSION, accountSession, loadAuthUser } from './auth-user.helper';

export const SESSION_HEADER = HTTP_HEADER.session;
export const SESSION_COOKIE = APP_COOKIE.session;

const isKind = (v: string | undefined): v is SessionKind => !!v && SESSION_KIND_VALUES.includes(v as SessionKind);

/**
 * DEV ONLY (AUTH_SIMULATED, forbidden in production): the web sends `x-was-session: anon|reader|admin` (its session
 * switcher); the kind maps to the demo accounts of the seed (DEMO_SESSION_EMAILS). The effective kind follows the
 * account role (a demoted admin is a reader) and the consent rule (outdated Terms/Privacy = pending). Demo accounts
 * count as e-mail verified. Missing account (empty database) = anonymous.
 */
export const createSimulatedAuthProvider = (db: Database): AuthProvider => ({
  name: 'simulated',
  async resolve(req) {
    const raw = req.header(SESSION_HEADER) ?? req.cookie(SESSION_COOKIE) ?? req.query('as');
    if (!isKind(raw) || raw === SessionKind.Anon) return ANON_SESSION;
    const user = await loadAuthUser(db, { email: DEMO_SESSION_EMAILS[raw] });
    if (!user) return ANON_SESSION;
    return accountSession(db, { ...user, emailVerified: true }, 'simulated');
  },
});
