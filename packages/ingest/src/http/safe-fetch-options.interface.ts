/** Options of the SafeFetcher (every one has a production default; tests inject fetch, DNS, sleep and clock). */
export interface SafeFetchOptions {
  cacheDir?: string | null;
  maxBytes?: number;
  timeoutMs?: number;
  maxRedirects?: number;
  fetchImpl?: typeof fetch;
  resolve?: (host: string) => Promise<string[]>;
  sleep?: (ms: number) => Promise<void>;
  now?: () => number;
}
