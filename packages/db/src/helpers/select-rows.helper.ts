import type { SQL } from 'drizzle-orm';

import type { Database } from '../client';

/**
 * Runs a raw `sql` query and returns its rows typed as `T`. Both drivers (PGlite and node-postgres) return
 * `{ rows }` from `execute`, but Drizzle types the result per driver; this is the single place that bridges it
 * (replaces the `as unknown as { rows }` casts). `T` is trusted, not validated: alias columns to match it.
 */
export const selectRows = async <T>(db: Pick<Database, 'execute'>, query: SQL): Promise<T[]> => ((await db.execute(query)) as unknown as { rows: T[] }).rows;
