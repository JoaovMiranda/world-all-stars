export interface ImageProxyOptions {
  /** LRU budget in bytes (0 = no in-process cache: every request goes upstream). */
  cacheBytes: number;
  timeoutMs: number;
  /** Wikimedia's User-Agent policy asks for an identifiable client. */
  userAgent: string;
  /** Replaced in tests. */
  fetch?: typeof fetch;
}
