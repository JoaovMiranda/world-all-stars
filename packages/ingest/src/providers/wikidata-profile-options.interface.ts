/** Options of the wikidata-profile provider run. */
export interface WikidataProfileOptions {
  /** Profiles read (default 5000). */
  limit?: number | undefined;
  /** Only these athletes (autonomous collection). */
  entityIds?: Set<string>;
}
