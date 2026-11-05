import type { Database } from '@was/db';

import { CATALOG_TABLES, loadCatalogRows } from './catalog.repository';
import { CatalogView } from './catalog.mapper';

/**
 * In-memory catalog snapshot (one per process). The BaseRepository's onWrite hook calls `onWrite(table)`, so any
 * write to a catalog table drops it automatically: services never invalidate by hand. Concurrent first reads share
 * one load.
 */
export class CatalogCache {
  private current: Promise<CatalogView> | null = null;
  private generation = 0;

  constructor(private readonly db: Database) {}

  get(): Promise<CatalogView> {
    if (!this.current) {
      const generation = this.generation;
      const load = loadCatalogRows(this.db).then((rows) => new CatalogView(rows));
      this.current = load;
      load.catch(() => {
        if (this.generation === generation) this.current = null;
      });
    }
    return this.current;
  }

  onWrite(table: string): void {
    if (!CATALOG_TABLES.has(table)) return;
    this.generation += 1;
    this.current = null;
  }
}
