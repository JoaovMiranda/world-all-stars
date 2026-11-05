/** Versioned public documents (doc 13 `legal_documents.kind`) whose acceptance is recorded. */
export const LegalDocumentKind = {
  Privacy: 'privacy',
  Terms: 'terms',
  Cookies: 'cookies',
} as const;
export type LegalDocumentKind = (typeof LegalDocumentKind)[keyof typeof LegalDocumentKind];
export const LEGAL_DOCUMENT_KIND_VALUES = Object.values(LegalDocumentKind) as [LegalDocumentKind, ...LegalDocumentKind[]];
