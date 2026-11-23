import path from 'node:path';
import type { DatabaseOptions } from '../interfaces/database-options.interface';
import { findRepoRoot } from './repo-root.helper';

/** DATABASE_URL → Postgres; else PGLITE_DATA_DIR (relative to the repo root) or `.data/pglite`. Pure: reads `env` only. */
export const databaseOptionsFromEnv = (env: NodeJS.ProcessEnv = process.env): DatabaseOptions => ({
  databaseUrl: env.DATABASE_URL || undefined,
  pgliteDataDir: env.PGLITE_DATA_DIR
    ? env.PGLITE_DATA_DIR.startsWith('memory://')
      ? env.PGLITE_DATA_DIR
      : path.resolve(findRepoRoot(), env.PGLITE_DATA_DIR)
    : undefined,
});
