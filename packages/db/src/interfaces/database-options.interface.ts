import type { PoolOptions } from './pool-options.interface';

export interface DatabaseOptions {
  /** Postgres URL: uses node-postgres. Without it, PGlite (embedded, zero infra). */
  databaseUrl?: string | undefined;
  /** PGlite data directory, or `memory://` for an in-memory database (tests). */
  pgliteDataDir?: string | undefined;
  /** Folder of the SQL migrations (default: next to this module, `./migrations`). */
  migrationsFolder?: string | undefined;
  /** node-postgres pool (ignored by PGlite, which has a single connection). */
  pool?: PoolOptions | undefined;
}
