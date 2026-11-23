import { DEFAULT_PAGE_SIZE } from '@was/shared';
import type { SQL } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

import { active } from '../helpers/active.helper';
import { selectRows } from '../helpers/select-rows.helper';
import type { PageWindow } from '../interfaces/page-window.interface';
import type { Database } from '../types/database.type';

/** Largest page a read model serves, whatever the caller asks for. */
const MAX_PAGE_SIZE = 100;

/**
 * Base of every read model (query-only repository). Writes never go through it: they use `BaseRepository`
 * (versioning + audit + soft delete). Subclasses get the handle, typed raw queries, the soft-delete filter and paging.
 */
export abstract class BaseReadRepository {
  constructor(protected readonly db: Database) {}

  /** Rows of a raw `sql` query typed as `T` (alias the columns to match it). */
  protected selectRows<T>(query: SQL): Promise<T[]> {
    return selectRows<T>(this.db, query);
  }

  /** Live rows only (`deleted_at is null`) plus the extra conditions. */
  protected active(table: { deletedAt: PgColumn }, ...where: (SQL | undefined)[]): SQL | undefined {
    return active(table, ...where);
  }

  /** SQL window of a 1-based page; invalid pages fall back to 1 and the size is capped at 100. */
  protected pageWindow(page = 1, pageSize = DEFAULT_PAGE_SIZE): PageWindow {
    const size = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(pageSize) || DEFAULT_PAGE_SIZE));
    const current = Math.max(1, Math.trunc(page) || 1);
    return { limit: size, offset: (current - 1) * size };
  }
}
