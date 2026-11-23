import type { PgColumn, PgTable } from 'drizzle-orm/pg-core';

/** Every table has the base columns (columns/base.column.ts). */
export type BaseCols = { id: PgColumn; version: PgColumn; deletedAt: PgColumn; deletedBy: PgColumn; updatedAt: PgColumn; updatedBy: PgColumn };
export type BaseTable = PgTable & BaseCols;
