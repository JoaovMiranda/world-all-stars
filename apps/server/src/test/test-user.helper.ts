import { SYSTEM_ACTOR, users } from '@was/db';
import { type Locale, uuidv7 } from '@was/shared';

import type { AuthUser } from '../auth/auth-provider.type';
import { loadAuthUser } from '../auth/auth-user.helper';
import type { RequestContext } from '../core/request-context.interface';
import type { TestApp } from './test-app.interface';

/** A fresh verified reader account (optionally created in the past, for account-age rules). */
export const createTestUser = async (t: TestApp, label: string, createdAt?: Date): Promise<AuthUser> => {
  const row = await t.deps.repo.insert(
    users,
    { email: `${label}-${uuidv7()}@test.invalid`, displayName: label, emailVerified: true, ...(createdAt ? { createdAt } : {}) },
    SYSTEM_ACTOR,
  );
  return (await loadAuthUser(t.deps.db, { id: row.id }))!;
};

/** Request context of a signed-in reader, for service-level tests (no HTTP, no session cookie). */
export const readerContext = (t: TestApp, user: AuthUser, { ipHash = 'ip-test', locale = 'pt-BR' as Locale } = {}): RequestContext => ({
  deps: t.deps,
  session: { kind: 'reader', user, pending: null, source: 'simulated' },
  actor: { userId: user.id, name: user.name, via: 'user', ipHash },
  ipHash,
  locale,
});
