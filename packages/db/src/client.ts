import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzleNodePg } from 'drizzle-orm/node-postgres';
import { migrate as migrateNodePg } from 'drizzle-orm/node-postgres/migrator';
import { drizzle as drizzlePglite } from 'drizzle-orm/pglite';
import { migrate as migratePglite } from 'drizzle-orm/pglite/migrator';
import pg from 'pg';

import { DEFAULT_PGLITE_DIR } from './consts/default-pglite-dir.const';
import type { DatabaseHandle } from './interfaces/database-handle.interface';
import type { DatabaseOptions } from './interfaces/database-options.interface';
import * as schema from './schema';
import type { Database } from './types/database.type';

export const defaultMigrationsFolder = (): string => fileURLToPath(new URL('./migrations', import.meta.url));

const redact = (url: string): string => url.replace(/\/\/([^:@/]+):[^@/]*@/, '//$1:***@');

/**
 * Opens the database: node-postgres when `databaseUrl` (DATABASE_URL) is set, else PGlite persisted under
 * `.data/pglite` (gitignored). PGlite is single-process: stop the server before running the CLI on the same dir.
 */
export const createDatabase = async (options: DatabaseOptions = {}): Promise<DatabaseHandle> => {
  const migrationsFolder = options.migrationsFolder ?? defaultMigrationsFolder();
  if (options.databaseUrl) {
    const p = options.pool ?? {};
    const pool = new pg.Pool({
      connectionString: options.databaseUrl,
      max: p.max ?? 10,
      connectionTimeoutMillis: p.connectionTimeoutMs ?? 5_000,
      idleTimeoutMillis: p.idleTimeoutMs ?? 30_000,
      // Sent as a startup parameter: Postgres cancels any statement running longer (a stuck query never holds a
      // connection forever). query_timeout is the client-side backstop when the server does not answer at all.
      statement_timeout: p.statementTimeoutMs ?? 10_000,
      query_timeout: (p.statementTimeoutMs ?? 10_000) + 2_000,
    });
    // An idle client that loses its connection emits 'error' on the pool: log it instead of crashing the process.
    pool.on('error', (error) => console.error('[db] idle Postgres client error', error));
    // A client whose server process dies mid-query also emits 'error' on itself: log it instead of crashing.
    pool.on('connect', (client) => client.on('error', (error) => console.error('[db] Postgres client error', error)));
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
