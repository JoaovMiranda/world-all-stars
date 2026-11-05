import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { migrate as migrateNodePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import pg from 'pg';

import * as schema from './schema';

export type Schema = typeof schema;
/** Driver-agnostic Drizzle database (PGlite and node-postgres share the pg-core API). */
export type Database = PgDatabase<PgQueryResultHKT, Schema>;
export type DatabaseDriver = 'pglite' | 'postgres';

export interface DatabaseHandle {
  db: Database;
  driver: DatabaseDriver;
  /** Where the data lives (PGlite dir, `memory://` or the Postgres URL without password). */
  location: string;
  migrate(): Promise<void>;
  close(): Promise<void>;
}

export interface DatabaseOptions {
  /** Postgres URL: uses node-postgres. Without it, PGlite (embedded, zero infra). */
  databaseUrl?: string | undefined;
  /** PGlite data directory, or `memory://` for an in-memory database (tests). */
  pgliteDataDir?: string | undefined;
  /** Folder of the SQL migrations (default: next to this module, `./migrations`). */
  migrationsFolder?: string | undefined;
}

/** Repository root (folder with pnpm-workspace.yaml), so `.data/` lands in the same place whatever the cwd. */
export const findRepoRoot = (from: string = process.cwd()): string => {
  let dir = path.resolve(from);
  while (!fs.existsSync(path.join(dir, 'pnpm-workspace.yaml'))) {
    const parent = path.dirname(dir);
    if (parent === dir) return path.resolve(from);
    dir = parent;
  }
  return dir;
};

export const DEFAULT_PGLITE_DIR = (): string => path.join(findRepoRoot(), '.data', 'pglite');
export const defaultMigrationsFolder = (): string => fileURLToPath(new URL('./migrations', import.meta.url));

const redact = (url: string): string => url.replace(/\/\/([^:@/]+):[^@/]*@/, '//$1:***@');

/**
 * Opens the database: node-postgres when `databaseUrl` (DATABASE_URL) is set, else PGlite persisted under
 * `.data/pglite` (gitignored). PGlite is single-process: stop the server before running the CLI on the same dir.
 */
export const createDatabase = async (options: DatabaseOptions = {}): Promise<DatabaseHandle> => {
  const migrationsFolder = options.migrationsFolder ?? defaultMigrationsFolder();
  if (options.databaseUrl) {
    const pool = new pg.Pool({ connectionString: options.databaseUrl });
    const db = drizzleNodePg(pool, { schema, casing: 'snake_case' });
    return {
      db: db as unknown as Database,
      driver: 'postgres',
      location: redact(options.databaseUrl),
      migrate: () => migrateNodePg(db, { migrationsFolder }),
      close: () => pool.end(),
    };
  }
  const dataDir = options.pgliteDataDir ?? DEFAULT_PGLITE_DIR();
  if (!dataDir.startsWith('memory://')) fs.mkdirSync(dataDir, { recursive: true });
  const client = await PGlite.create(dataDir);
  const db = drizzlePglite(client, { schema, casing: 'snake_case' });
  return {
    db: db as unknown as Database,
    driver: 'pglite',
    location: dataDir,
    migrate: () => migratePglite(db, { migrationsFolder }),
    close: () => client.close(),
  };
};
