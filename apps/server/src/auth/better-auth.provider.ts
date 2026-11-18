import type { Database } from '@was/db';

import type { AuthProvider } from './auth-provider.type';
import { ANON_SESSION, sessionForUserId } from './auth-user.helper';

/** The part of Better Auth the provider needs (tests stub it). */
export interface SessionLookup {
  getSession(input: { headers: Headers }): Promise<{ user: { id: string } } | null>;
}

/**
 * Real sign-in (Google via Better Auth): the `was.session_token` cookie → Better Auth session → our `users` row
 * (live, with role/ban/counters) → consent rule (outdated Terms/Privacy = pending, which counts as anonymous).
 */
export const createBetterAuthProvider = (db: Database, lookup: SessionLookup): AuthProvider => ({
  name: 'better-auth',
  async resolve(req) {
    const found = await lookup.getSession({ headers: req.headers }).catch((error: unknown) => {
      console.error('[auth] getSession failed', error);
      return null;
    });
    if (!found) return ANON_SESSION;
    return sessionForUserId(db, found.user.id, 'better-auth');
  },
});
