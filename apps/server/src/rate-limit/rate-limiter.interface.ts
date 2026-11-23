import type { RateLimitKey } from '@was/shared';

export interface RateLimiter {
  /** Counts a hit of `subject` (user id or ip hash) in the bucket; throws 429 over the limit. */
  hit(key: RateLimitKey, subject: string): Promise<void>;
}
