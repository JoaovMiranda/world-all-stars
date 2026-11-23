import type { RateLimitDecision } from './rate-limit-decision.interface';
import type { RateLimitRule } from './rate-limit-rule.interface';

/**
 * Where the counters live (doc 05). `consume` counts one hit and decides in a single atomic step, so concurrent
 * requests (or several server instances, with the database store) can never all pass a stale read.
 */
export interface RateLimitStore {
  readonly kind: 'memory' | 'database';
  consume(key: string, rule: RateLimitRule, now?: Date): Promise<RateLimitDecision>;
}
