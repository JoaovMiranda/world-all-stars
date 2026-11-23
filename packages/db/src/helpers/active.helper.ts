import { and, isNull, type SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

/** Live rows only (soft delete): the default filter of every read. */
export const active = (table: { deletedAt: PgColumn }, ...where: (SQL | undefined)[]): SQL | undefined => and(isNull(table.deletedAt), ...where);
