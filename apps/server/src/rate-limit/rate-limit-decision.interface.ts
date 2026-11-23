export interface RateLimitDecision {
  allowed: boolean;
  /** Time until the window restarts (0 when allowed). */
  retryAfterMs: number;
}
