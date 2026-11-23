import { ApiErrorCode, RATE_LIMITS } from '@was/shared';
import type { BetterAuthOptions } from 'better-auth';

import { httpError } from '../http/http-error.helper';
import { hashIp } from '../middlewares/session.middleware';
import type { RateLimitStore } from './rate-limit-store.interface';
import type { RateLimiter } from './rate-limiter.interface';

/** API limits (RATE_LIMITS of @was/shared, per route) on top of a store (memory or the shared database table). */
export const createRateLimiter = (store: RateLimitStore, enabled: boolean, now: () => Date = () => new Date()): RateLimiter => ({
  async hit(key, subject) {
    if (!enabled) return;
    const { allowed } = await store.consume(`${key}:${subject}`, RATE_LIMITS[key], now());
    if (!allowed) throw httpError(429, ApiErrorCode.RateLimited, 'rateLimited');
  },
});

type BetterAuthRateLimitStorage = NonNullable<NonNullable<BetterAuthOptions['rateLimit']>['customStorage']>;

/**
 * Better Auth's limits on the same store (rateLimit.customStorage). Its key is `<ip>|<path>`: only a salted hash
 * of it is stored (doc 05: no raw IP at rest), which is why its built-in `storage: 'database'` is not used.
 */
export const betterAuthRateLimitStorage = (store: RateLimitStore, salt: string): BetterAuthRateLimitStorage => ({
  async consume(key, rule) {
    const { allowed, retryAfterMs } = await store.consume(`auth:${hashIp(key, salt)}`, { windowMs: rule.window * 1000, max: rule.max });
    return { allowed, retryAfter: allowed ? null : Math.ceil(retryAfterMs / 1000) };
  },
});
