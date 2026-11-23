/** A query refreshed after a write: every key of the endpoint, or only those `match` selects. */
export interface Invalidation {
  baseKey: readonly unknown[];
  /** (mutation input, query input) → refresh this cached query? Absent = every key of the endpoint. */
  match?: (mutationInput: unknown, queryInput: unknown) => boolean;
}
