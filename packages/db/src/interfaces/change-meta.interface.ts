export interface ChangeMeta {
  /** Human summary kept in entity_versions (profile Versions tab). */
  summary?: string;
  reason?: string | null;
  /** Optimistic lock: refuse when the row moved on (3-way diff on the admin side). */
  expectedVersion?: number;
}
