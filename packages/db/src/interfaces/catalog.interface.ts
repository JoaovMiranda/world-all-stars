import type { CatalogSport } from './catalog-sport.interface';

/** Shape of data/catalog/sports.catalog.json. */
export interface Catalog {
  subgroups: [slug: string, group: string, en: string, pt: string, es: string][];
  events: Record<string, [slug: string, org: string, en: string, pt: string, es: string]>;
  organizations: Record<string, string>;
  sports: CatalogSport[];
}
