/** A fixed window: at most `max` hits per `windowMs` (same shape as RATE_LIMITS in @was/shared). */
export interface RateLimitRule {
  windowMs: number;
  max: number;
}
