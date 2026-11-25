import { z } from 'zod';

import { CONSENT_PURPOSE_VALUES } from '../enums/consent-purpose.enum';
import { LEGAL_DOCUMENT_KIND_VALUES } from '../enums/legal-document-kind.enum';
import { MyInteractionsResponseSchema } from './competitor-interaction.schema';
import { MeResponseSchema, NotificationSchema } from './session.schema';

/** One acceptance of a legal document version (doc 13 `user_consents`). */
export const LegalAcceptanceSchema = z.object({
  document: z.enum(LEGAL_DOCUMENT_KIND_VALUES),
  version: z.string().min(1),
  acceptedAt: z.iso.datetime(),
});

/** State of an optional purpose; a purpose missing from the list was never granted. */
export const ConsentSchema = z.object({
  purpose: z.enum(CONSENT_PURPOSE_VALUES),
  granted: z.boolean(),
  updatedAt: z.iso.datetime().nullable(),
});

/** Response of GET /api/me/data (E6): acceptances of the Terms/Privacy and optional consents. */
export const MyDataResponseSchema = z.object({
  acceptances: z.array(LegalAcceptanceSchema),
  consents: z.array(ConsentSchema),
});

export const ConsentPurposeParamsSchema = z.object({ purpose: z.enum(CONSENT_PURPOSE_VALUES) });
/** Body of PUT /api/me/consents/:purpose. */
export const UpdateConsentRequestSchema = z.object({ granted: z.boolean() });

/** Body of DELETE /api/me: the confirmation word (ACCOUNT_DELETE_CONFIRMATION). */
export const DeleteAccountRequestSchema = z.object({ confirmation: z.string() });
/** Response of DELETE /api/me: the pseudonym that now signs the kept comments and votes. */
export const DeleteAccountResponseSchema = z.object({ pseudonym: z.string().min(1) });

/** Response of POST /api/me/export (portability, LGPD art. 18 V): everything tied to the account, as JSON. */
export const MyDataExportSchema = MeResponseSchema.extend({
  exportedAt: z.iso.datetime(),
  notifications: z.array(NotificationSchema),
  acceptances: z.array(LegalAcceptanceSchema),
  consents: z.array(ConsentSchema),
  /** My star and hearts (D02/D03). */
  interactions: MyInteractionsResponseSchema.optional(),
});
