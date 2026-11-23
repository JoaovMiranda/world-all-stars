/** One sport/discipline of data/catalog/sports.catalog.json. */
export interface CatalogSport {
  slug: string;
  subgroup: string;
  format: string;
  environment: string;
  parent: string | null;
  wikidataQid: string | null;
  wikipediaUrl: string | null;
  names: Record<'en' | 'pt-BR' | 'es', string | null>;
  programmes: { event: string; status: string; years: number[] }[];
  aliases: { name: string; kind: string }[];
}
