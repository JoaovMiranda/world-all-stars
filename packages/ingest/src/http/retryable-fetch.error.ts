/** HTTP 429 / 503: the request may be retried after `retryAfterMs`. */
export class RetryableFetchError extends Error {
  constructor(
    readonly url: string,
    readonly status: number,
    readonly retryAfterMs: number,
  ) {
    super(`HTTP ${status} on ${url}: retry after ${retryAfterMs} ms`);
    this.name = 'RetryableFetchError';
  }
}
