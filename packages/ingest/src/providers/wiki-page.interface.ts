/** A Wikipedia page as the providers read it (wikitext + stored document id). */
export interface WikiPage {
  title: string;
  url: string;
  revisionId: string | null;
  text: string;
  documentId: string;
}
