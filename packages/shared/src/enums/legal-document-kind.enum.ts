/** Versioned public documents (doc 13 `legal_documents.kind`) whose acceptance is recorded. */
export const LegalDocumentKind = {
  Privacy: 'privacy',
  Terms: 'terms',
  Cookies: 'cookies',
  /** Self-declaration of being 18+ at sign-up (doc 13): its own auditable acceptance row. */
  AgeDeclaration: 'age_declaration',
} as const;
export type LegalDocumentKind = (typeof LegalDocumentKind)[keyof typeof LegalDocumentKind];
export const LEGAL_DOCUMENT_KIND_VALUES = Object.values(LegalDocumentKind) as [LegalDocumentKind, ...LegalDocumentKind[]];
