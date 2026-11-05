import { uuidv7 } from '@was/shared';
import { type SQL, sql } from 'drizzle-orm';
import { integer, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/** timestamptz read as Date (mappers turn it into ISO strings for the API). */
export const timestamptz = () => timestamp({ withTimezone: true, mode: 'date' });

/**
 * Base columns of EVERY table (doc 03): uuid v7 id generated in the app, audit columns, soft delete and version.
 * Spread it in each table; nobody declares these by hand. `created_by/updated_by/deleted_by` hold user ids
 * (null = system) without an FK, so system writes and anonymized accounts never break a constraint.
 */
export const baseColumns = () => ({
  id: uuid().primaryKey().$defaultFn(() => uuidv7()),
  createdAt: timestamptz().notNull().defaultNow(),
  createdBy: uuid(),
  /** 'user' | 'system:<source>' | 'seed' */
  createdVia: text().notNull().default('user'),
  updatedAt: timestamptz().notNull().defaultNow(),
  updatedBy: uuid(),
  deletedAt: timestamptz(),
  deletedBy: uuid(),
  version: integer().notNull().default(1),
});

/** Partial-index predicate: unique keys only among live rows (soft delete keeps the old ones). */
export const live = (deletedAt: unknown): SQL => sql`${deletedAt} is null`;
