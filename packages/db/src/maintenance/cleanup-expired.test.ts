import { uuidv7 } from '@was/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabase, type DatabaseHandle } from '../client';
import { authSessions, authVerifications } from '../tables/auth.table';
import { rateLimitBuckets } from '../tables/rate-limit.table';
import { users } from '../tables/user.table';
import { cleanupExpired } from './cleanup-expired';

describe('cleanupExpired (pnpm db:cleanup / server scheduler)', () => {
  let handle: DatabaseHandle;
  beforeAll(async () => {
    handle = await createDatabase({ pgliteDataDir: 'memory://' });
    await handle.migrate();
  });
  afterAll(() => handle.close());

  it('deletes only the expired sessions, verifications and rate-limit windows (exempt from forbid_delete)', async () => {
    const now = new Date('2026-11-17T12:00:00Z');
    const past = new Date(now.getTime() - 1000);
    const future = new Date(now.getTime() + 60_000);
    const [user] = await handle.db.insert(users).values({ email: 'cleanup@test.invalid', displayName: 'Cleanup' }).returning();
    await handle.db.insert(authSessions).values([
      { id: uuidv7(), userId: user!.id, token: 'expired', expiresAt: past },
      { id: uuidv7(), userId: user!.id, token: 'live', expiresAt: future },
    ]);
    await handle.db.insert(authVerifications).values([
      { id: uuidv7(), identifier: 'state-old', value: 'x', expiresAt: past },
      { id: uuidv7(), identifier: 'state-new', value: 'x', expiresAt: future },
    ]);
    await handle.db.insert(rateLimitBuckets).values([
      { key: 'read:old', count: 3, windowStart: past, expiresAt: past },
      { key: 'read:new', count: 1, windowStart: now, expiresAt: future },
    ]);

    expect(await cleanupExpired(handle.db, now)).toEqual({ authSessions: 1, authVerifications: 1, rateLimitBuckets: 1 });
    expect((await handle.db.select().from(authSessions)).map((r) => r.token)).toEqual(['live']);
    expect((await handle.db.select().from(authVerifications)).map((r) => r.identifier)).toEqual(['state-new']);
    expect((await handle.db.select().from(rateLimitBuckets)).map((r) => r.key)).toEqual(['read:new']);
    // Idempotent: nothing left to delete.
    expect(await cleanupExpired(handle.db, now)).toEqual({ authSessions: 0, authVerifications: 0, rateLimitBuckets: 0 });
  });
});
