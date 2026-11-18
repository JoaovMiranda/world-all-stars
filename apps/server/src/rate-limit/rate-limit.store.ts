import { type Database, rateLimitBuckets } from '@was/db';
import { sql } from 'drizzle-orm';

/** A fixed window: at most `max` hits per `windowMs` (same shape as RATE_LIMITS in @was/shared). */
export interface RateLimitRule {
  windowMs: number;
  max: number;
}
export interface RateLimitDecision {
  allowed: boolean;
  /** Time until the window restarts (0 when allowed). */
  retryAfterMs: number;
}

/**
 * Where the counters live (doc 05). `consume` counts one hit and decides in a single atomic step, so concurrent
 * requests (or several server instances, with the database store) can never all pass a stale read.
 */
export interface RateLimitStore {
  readonly kind: 'memory' | 'database';
  consume(key: string, rule: RateLimitRule, now?: Date): Promise<RateLimitDecision>;
}
export type RateLimitStoreKind = RateLimitStore['kind'];

const decision = (count: number, max: number, expiresAt: number, now: number): RateLimitDecision =>
  count <= max ? { allowed: true, retryAfterMs: 0 } : { allowed: false, retryAfterMs: Math.max(0, expiresAt - now) };

/** One process only (tests, dev on PGlite). Expired windows are dropped as they are met and on each new window. */
export const createMemoryRateLimitStore = (): RateLimitStore => {
  const windows = new Map<string, { count: number; expiresAt: number }>();
  const prune = (now: number) => {
    for (const [key, w] of windows) if (w.expiresAt <= now) windows.delete(key);
  };
  return {
    kind: 'memory',
    async consume(key, { windowMs, max }, at = new Date()) {
      const now = at.getTime();
      const w = windows.get(key);
      if (!w || w.expiresAt <= now) {
        prune(now);
        windows.set(key, { count: 1, expiresAt: now + windowMs });
        return decision(1, max, now + windowMs, now);
      }
      w.count += 1;
      return decision(w.count, max, w.expiresAt, now);
    },
  };
};

/**
 * Shared by every instance: one upsert per hit on `rate_limit_buckets` (restarts the window when it has ended).
 * Expired rows are deleted by the cleanup job (cleanupExpired in @was/db).
 */
export const createDatabaseRateLimitStore = (db: Database): RateLimitStore => ({
  kind: 'database',
  async consume(key, { windowMs, max }, now = new Date()) {
    const expiresAt = new Date(now.getTime() + windowMs);
    const t = rateLimitBuckets;
    const ended = sql`${t.expiresAt} <= ${now.toISOString()}::timestamptz`;
    const [row] = await db
      .insert(t)
      .values({ key, count: 1, windowStart: now, expiresAt })
      .onConflictDoUpdate({
        target: t.key,
        set: {
          count: sql`CASE WHEN ${ended} THEN 1 ELSE ${t.count} + 1 END`,
          windowStart: sql`CASE WHEN ${ended} THEN excluded.window_start ELSE ${t.windowStart} END`,
          expiresAt: sql`CASE WHEN ${ended} THEN excluded.expires_at ELSE ${t.expiresAt} END`,
        },
      })
      .returning({ count: t.count, expiresAt: t.expiresAt });
    if (!row) throw new Error(`rate limit upsert returned no row for ${key}`);
    return decision(row.count, max, row.expiresAt.getTime(), now.getTime());
  },
});

export const createRateLimitStore = (kind: RateLimitStoreKind, db: Database): RateLimitStore =>
  kind === 'database' ? createDatabaseRateLimitStore(db) : createMemoryRateLimitStore();
