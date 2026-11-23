import type { Database } from '@was/db';
import { DEFAULT_LOCALE, type Locale } from '@was/shared';

import { CATALOG_TABLES } from './catalog.const';
import { loadCatalogRows } from './catalog.repository';
import { CatalogView } from './catalog.view';
import type { CatalogRows } from './catalog-rows.type';

/**
 * In-memory catalog snapshot (one per process): the rows are loaded once and one view is built per locale (texts
 * resolved requested → pt-BR → en → any). The BaseRepository's onWrite hook calls `onWrite(table)`, so any write to
 * a catalog table drops rows and every view: services never invalidate by hand. Concurrent first reads share one load.
 */
export class CatalogCache {
  private rows: Promise<CatalogRows> | null = null;
  private readonly views = new Map<Locale, Promise<CatalogView>>();
  private generation = 0;

  constructor(private readonly db: Database) {}

  private loadRows(): Promise<CatalogRows> {
    if (!this.rows) {
      const generation = this.generation;
      const load = loadCatalogRows(this.db);
      this.rows = load;
      load.catch(() => {
        if (this.generation === generation) this.rows = null;
      });
    }
    return this.rows;
  }

  get(locale: Locale = DEFAULT_LOCALE): Promise<CatalogView> {
    let view = this.views.get(locale);
    if (!view) {
      const generation = this.generation;
      view = this.loadRows().then((rows) => new CatalogView(rows, locale));
      this.views.set(locale, view);
      view.catch(() => {
        if (this.generation === generation) this.views.delete(locale);
      });
    }
    return view;
  }

  onWrite(table: string): void {
    if (!CATALOG_TABLES.has(table)) return;
    this.generation += 1;
    this.rows = null;
    this.views.clear();
  }
}
