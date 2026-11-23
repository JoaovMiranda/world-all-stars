import type { Database } from '@was/db';
import type { sql } from 'drizzle-orm';

import type { SqlRow } from './sql-row.type';

/** Rows of a raw SQL query. */
export const rows = async (db: Database, q: ReturnType<typeof sql>) => ((await db.execute(q)) as unknown as { rows: SqlRow[] }).rows;
