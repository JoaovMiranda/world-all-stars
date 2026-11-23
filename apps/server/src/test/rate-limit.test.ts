// Rate-limit stores (doc 05): the same fixed-window contract for the in-memory store and the shared database table,
// the API limiter on top of them and Better Auth's customStorage adapter (hashed keys, retryAfter in seconds).
import { createDatabase, type DatabaseHandle, rateLimitBuckets } from '@was/db';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createDatabaseRateLimitStore, createMemoryRateLimitStore } from '../rate-limit/rate-limit.store';
import type { RateLimitStore } from '../rate-limit/rate-limit-store.interface';
import { betterAuthRateLimitStorage, createRateLimiter } from '../rate-limit/rate-limiter';

let handle: DatabaseHandle;
beforeAll(async () => {
  handle = await createDatabase({ pgliteDataDir: 'memory://' });
  await handle.migrate();
});
afterAll(() => handle.close());

const at = (ms: number) => new Date(Date.UTC(2026, 10, 17, 12) + ms);
const rule = { windowMs: 60_000, max: 3 };

describe.each([
  ['memory', () => createMemoryRateLimitStore()],
  ['database', () => createDatabaseRateLimitStore(handle.db)],
] as const)('%s store', (kind, make) => {
  let store: RateLimitStore;
  beforeAll(() => {
    store = make();
  });

  it('allows `max` hits per window, then refuses with the time left', async () => {
    const key = `${kind}:a`;
    for (let i = 0; i < 3; i++) expect((await store.consume(key, rule, at(i * 1000))).allowed).toBe(true);
    expect(await store.consume(key, rule, at(10_000))).toEqual({ allowed: false, retryAfterMs: 50_000 });
  });

  it('restarts the window once it has ended; keys are independent', async () => {
    const key = `${kind}:b`;
    for (let i = 0; i < 4; i++) await store.consume(key, rule, at(0));
    expect((await store.consume(`${kind}:other`, rule, at(0))).allowed).toBe(true);
    expect((await store.consume(key, rule, at(60_000))).allowed).toBe(true);
  });

  it('counts concurrent hits atomically', async () => {
    const results = await Promise.all(Array.from({ length: 6 }, () => store.consume(`${kind}:c`, rule, at(0))));
    expect(results.filter((r) => r.allowed)).toHaveLength(3);
  });
});

describe('API limiter and Better Auth storage', () => {
  it('the limiter throws 429 over RATE_LIMITS (contact: 5 per hour) and is a no-op when disabled', async () => {
    const limiter = createRateLimiter(createMemoryRateLimitStore(), true, () => at(0));
    for (let i = 0; i < 5; i++) await limiter.hit('contact', 'ip-hash');
    await expect(limiter.hit('contact', 'ip-hash')).rejects.toMatchObject({ status: 429 });
    const off = createRateLimiter(createMemoryRateLimitStore(), false);
    for (let i = 0; i < 10; i++) await off.hit('contact', 'ip-hash');
  });

  it('Better Auth keys are stored hashed (never the raw ip) and answer retryAfter in seconds', async () => {
    const storage = betterAuthRateLimitStorage(createDatabaseRateLimitStore(handle.db), 'test-salt');
    const key = '203.0.113.7|/sign-in/social';
    expect(await storage.consume(key, { window: 10, max: 1 })).toEqual({ allowed: true, retryAfter: null });
    const refused = await storage.consume(key, { window: 10, max: 1 });
    expect(refused.allowed).toBe(false);
    expect(refused.retryAfter).toBeGreaterThan(0);
    expect(refused.retryAfter).toBeLessThanOrEqual(10);
    const keys = (await handle.db.select({ key: rateLimitBuckets.key }).from(rateLimitBuckets)).map((r) => r.key);
    expect(keys.some((k) => k.startsWith('auth:') && !k.includes('203.0.113.7'))).toBe(true);
  });
});
