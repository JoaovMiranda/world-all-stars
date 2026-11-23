import type { CatalogRepository } from './catalog.repository';

/** Every row of the catalog snapshot, by table. */
export type CatalogRows = Awaited<ReturnType<CatalogRepository['load']>>;
