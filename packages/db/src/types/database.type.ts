import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';

import type * as schema from '../schema';

export type Schema = typeof schema;
/** Driver-agnostic Drizzle database (PGlite and node-postgres share the pg-core API). */
export type Database = PgDatabase<PgQueryResultHKT, Schema>;
export type DatabaseDriver = 'pglite' | 'postgres';
