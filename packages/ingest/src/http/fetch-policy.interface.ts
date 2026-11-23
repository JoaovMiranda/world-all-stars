/** Per-source fetch policy (from the sources table). */
export interface FetchPolicy {
  /** Hosts this source may be fetched from (exact or `*.domain`). */
  allowedHosts: readonly string[];
  /** Minimum interval between requests to the same host (ms). */
  minIntervalMs: number;
}
