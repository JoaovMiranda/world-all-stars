import { getTableColumns, getTableName, type SQL, sql } from 'drizzle-orm';
import { toSnakeCase } from 'drizzle-orm/casing';
import { getTableConfig, type PgColumn, type PgTable } from 'drizzle-orm/pg-core';

import type { Database } from '../types/database.type';

const IMMUTABLE = new Set(['id', 'createdAt', 'createdBy', 'createdVia']);

/**
 * Natural key of a table = its first UNIQUE index (declared once in the table file, partial on deleted_at).
 * Tables without one are keyed by id. The seed upserts on it, so it is idempotent.
 */
export const naturalKeyOf = (table: PgTable): { columns: PgColumn[]; where: SQL | undefined } | null => {
  const unique = getTableConfig(table).indexes.find((i) => i.config.unique);
  if (!unique) return null;
  const all = Object.values(getTableColumns(table)) as PgColumn[];
  const columns = unique.config.columns.map((c) => all.find((col) => col.name === (c as { name?: string }).name)!);
  return { columns, where: unique.config.where };
};

/** Column TS key by its database (snake_case) name: the prototype rows use database names. */
export const columnKeysByDbName = (table: PgTable): Map<string, string> => new Map(Object.keys(getTableColumns(table)).map((key) => [toSnakeCase(key), key]));

/** INSERT … ON CONFLICT (natural key or id) DO UPDATE, returning the id that is in the database. */
export const upsertRow = async (db: Database, table: PgTable, values: Record<string, unknown>): Promise<string> => {
  const key = naturalKeyOf(table);
  const columns = getTableColumns(table);
  const set = Object.fromEntries(
    Object.keys(values)
      .filter((k) => !IMMUTABLE.has(k) && !(key?.columns ?? []).some((c) => c.name === k))
      .map((k) => [k, sql.raw(`excluded."${toSnakeCase(columns[k]!.name)}"`)]),
  );
  const target = key ? key.columns : [columns.id as PgColumn];
  // Nothing to update (key-only rows): a no-op update still lets RETURNING give the existing id.
  if (!Object.keys(set).length) set.version = sql`${columns.version}`;
  const [row] = await db
    .insert(table)
    .values(values as never)
    .onConflictDoUpdate({ target, ...(key?.where ? { targetWhere: key.where } : {}), set: set as never })
    .returning({ id: columns.id as PgColumn });
  if (row) return row.id as string;
  throw new Error(`upsert returned no row for ${getTableName(table)}`);
};
