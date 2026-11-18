import { ApiErrorCode, RATE_LIMITS, type RateLimitKey } from '@was/shared';

import { httpError } from '../http/http-error.error';

export interface RateLimiter {
  /** Counts a hit of `subject` (user id or ip hash) in the bucket; throws 429 over the limit. */
  hit(key: RateLimitKey, subject: string): void;
}

/**
 * STUB (doc 05): in-memory fixed window per process, with the limits of RATE_LIMITS (@was/shared). Production:
 * hono-rate-limiter with a shared store (Redis/Upstash) behind Cloudflare WAF, same buckets.
 */
export const createRateLimiter = (enabled: boolean, now: () => number = Date.now): RateLimiter => {
  const windows = new Map<string, { start: number; count: number }>();
  return {
    hit(key, subject) {
      if (!enabled) return;
      const { windowMs, max } = RATE_LIMITS[key];
      const id = `${key}:${subject}`;
      const t = now();
      const w = windows.get(id);
      if (!w || t - w.start >= windowMs) {
        windows.set(id, { start: t, count: 1 });
        return;
      }
      w.count += 1;
      if (w.count > max) throw httpError(429, ApiErrorCode.RateLimited, 'rateLimited');
    },
  };
};
