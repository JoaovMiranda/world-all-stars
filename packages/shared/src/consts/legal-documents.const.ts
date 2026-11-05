import type { LegalDocumentKind } from '../enums/legal-document-kind.enum';

/**
 * Current version and effective date (YYYY-MM-DD) of each legal document (doc 13). The server records acceptances
 * against these; the pages show them. Drafts (0.x) are pending legal review and the company (CNPJ) definition.
 */
export const LEGAL_DOCUMENT_VERSIONS: Record<LegalDocumentKind, { version: string; effectiveAt: string }> = {
  privacy: { version: '0.1', effectiveAt: '2026-11-04' },
  terms: { version: '0.1', effectiveAt: '2026-11-04' },
  cookies: { version: '0.1', effectiveAt: '2026-11-04' },
};
/** Word the user types to confirm account deletion (anonymization, doc 13). Checked by the server too. */
export const ACCOUNT_DELETE_CONFIRMATION = 'EXCLUIR';
/** Minimum age to create an account (doc 13). */
export const ACCOUNT_MIN_AGE = 18;
/** Access logs (Marco Civil art. 15) and contact submissions retention, in months (docs 13, 21). */
export const ACCESS_LOG_RETENTION_MONTHS = 6;
export const CONTACT_RETENTION_MONTHS = 12;
