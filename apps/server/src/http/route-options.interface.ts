import type { RateLimitKey } from '@was/shared';

export interface RouteOptions {
  /** Rate-limit bucket of RATE_LIMITS (@was/shared), per user or IP. */
  rateLimit?: RateLimitKey;
}
