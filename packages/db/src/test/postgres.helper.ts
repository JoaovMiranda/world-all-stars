// Test-only: a fresh, migrated Postgres database per suite for the concurrency tests (T1.9). The suites run only
// when DATABASE_URL points at a disposable server (scripts/test/start-test-postgres.sh); each run creates its own
// database `was_test_<label>_<random>` and drops it afterwards, so the target server's data is never touched.
import { randomBytes } from 'node:crypto';

import pg from 'pg';

import { createDatabase } from '../client';
import type { DatabaseHandle } from '../interfaces/database-handle.interface';

/** Server URL of the concurrency suites; undefined → the suites are skipped. */
export const testDatabaseUrl = (): string | undefined => process.env.DATABASE_URL || undefined;

const withDatabase = (serverUrl: string, database: string): string => {
  const url = new URL(serverUrl);
  url.pathname = `/${database}`;
  return url.toString();
};

const admin = async <T>(serverUrl: string, fn: (client: pg.Client) => Promise<T>): Promise<T> => {
  const client = new pg.Client({ connectionString: serverUrl });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
};

/**
 * Creates and migrates a new database on the server of `serverUrl`. `open()` returns extra handles (separate
 * pools = separate "processes"); `drop()` closes every handle and drops the database.
 */
export const createFreshPostgres = async (label: string, serverUrl: string = testDatabaseUrl() ?? '') => {
  if (!serverUrl) throw new Error('DATABASE_URL is not set');
  const name = `was_test_${label.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${randomBytes(4).toString('hex')}`;
  await admin(serverUrl, (c) => c.query(`create database "${name}"`));
  const url = withDatabase(serverUrl, name);
  const handles: DatabaseHandle[] = [];
  const open = async (max = 10): Promise<DatabaseHandle> => {
    const handle = await createDatabase({ databaseUrl: url, pool: { max } });
    handles.push(handle);
    return handle;
  };
  const main = await open();
  await main.migrate();
  const drop = async () => {
    await Promise.allSettled(handles.map((h) => h.close()));
    await admin(serverUrl, (c) => c.query(`drop database if exists "${name}" with (force)`));
  };
  return { url, name, db: main.db, handle: main, open, drop };
};
