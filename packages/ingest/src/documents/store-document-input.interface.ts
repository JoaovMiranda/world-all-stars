/** A fetched document to store in source_documents (payload deduplicated by normalized hash). */
export interface StoreDocumentInput {
  sourceSlug: string;
  url: string;
  revisionId: string | null;
  httpStatus: number;
  contentType: string | null;
  bytes: Buffer;
  jobId?: string | null;
  /** Sections used as evidence (stored when the policy is evidence_excerpts). */
  excerpts?: string[];
}
