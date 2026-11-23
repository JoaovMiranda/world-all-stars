/** Value part of a Wikidata snak (`datavalue.value` is an item id, time, string, quantity… depending on the property). */
export interface WikidataSnak {
  datavalue?: { value: unknown };
}

/** One statement (claim) of a Wikidata entity, with optional qualifiers (e.g. P580 start time, P582 end time). */
export interface WikidataStatement {
  mainsnak: WikidataSnak;
  qualifiers?: Record<string, WikidataSnak[]>;
}

/** Entity as returned by `wbgetentities` (only the requested `props` are present). */
export interface WikidataEntity {
  id: string;
  labels?: Record<string, { value: string }>;
  descriptions?: Record<string, { value: string }>;
  sitelinks?: Record<string, { title: string }>;
  claims?: Record<string, WikidataStatement[]>;
}
