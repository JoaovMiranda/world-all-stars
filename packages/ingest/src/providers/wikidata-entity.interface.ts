/** The part of a Wikidata entity the `wikidata` provider reads (enwiki sitelink and claims). */
export interface WdEntity {
  id: string;
  sitelinks?: { enwiki?: { title: string } };
  claims?: Record<string, { mainsnak: { datavalue?: { value: unknown } } }[]>;
}
