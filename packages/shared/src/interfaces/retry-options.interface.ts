/** Options of `retryWithBackoff`. A failed attempt is retried only when a wait can be derived for it. */
export interface RetryOptions {
  /** Total attempts, including the first one (≥ 1). */
  attempts: number;
  /** Wait demanded by the error itself (e.g. HTTP `Retry-After`); `undefined`/`null` falls back to `baseMs`. */
  retryAfterMs?: (error: unknown) => number | null | undefined;
  /** Exponential backoff base: attempt n (0-based) waits `baseMs * 2^n`. Without it, only `retryAfterMs` errors retry. */
  baseMs?: number;
  /** Random extra wait in `[0, jitter * wait)`, e.g. `0.2` for up to +20 %. Default 0. */
  jitter?: number;
  /** Injected for tests. Default: the shared `sleep`. */
  sleep?: (ms: number) => Promise<void>;
  /** Injected for tests. Default: `Math.random`. */
  random?: () => number;
  /** Called before each wait (logging). */
  onRetry?: (error: unknown, waitMs: number, attempt: number) => void;
}
