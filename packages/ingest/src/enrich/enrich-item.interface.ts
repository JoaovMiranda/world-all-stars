/** One athlete text given to an enrichment task. */
export interface EnrichItem {
  entityId: string;
  name: string;
  sourceText: string;
  sourceUrl: string;
  sectionKey: string;
  /** Database facts given to the biography task (titles, clubs, birth…). */
  facts?: string;
}
