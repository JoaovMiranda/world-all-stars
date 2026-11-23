import type { RetryOptions } from '../interfaces/retry-options.interface';
import { sleep as defaultSleep } from './sleep.helper';

/**
 * Runs `fn` until it resolves or `attempts` are used. After a failure it waits `retryAfterMs(error)` when the error
 * provides one, else `baseMs * 2^attempt` (+ jitter); errors with no derivable wait, and the last failure, are rethrown.
 */
export const retryWithBackoff = async <T>(fn: (attempt: number) => Promise<T>, options: RetryOptions): Promise<T> => {
  const { attempts, retryAfterMs, baseMs, jitter = 0, sleep = defaultSleep, random = Math.random, onRetry } = options;
  if (!Number.isInteger(attempts) || attempts < 1) throw new RangeError(`attempts must be a positive integer, got ${attempts}`);
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      const demanded = retryAfterMs?.(error);
      const base = demanded ?? (baseMs === undefined ? undefined : baseMs * 2 ** attempt);
      if (base === undefined || attempt >= attempts - 1) throw error;
      const wait = Math.round(base + (jitter > 0 ? random() * jitter * base : 0));
      onRetry?.(error, wait, attempt);
      await sleep(wait);
    }
  }
};
