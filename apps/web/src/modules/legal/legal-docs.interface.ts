import type { DocumentContent } from '@/shared-ui/document-content.interface';

/** The four legal documents of one language. */
export interface LegalDocs {
  privacy: DocumentContent;
  terms: DocumentContent;
  cookies: DocumentContent;
  accessibility: DocumentContent;
}
