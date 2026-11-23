import type { z } from 'zod';

import type {
  AddCollectionLinksRequestSchema,
  AdminAuditEntrySchema,
  AdminDecisionRequestSchema,
  AdminDossierSchema,
  AdminQueuedLinkSchema,
  AdminSourceSchema,
  AdminSourcesResponseSchema,
  AdminSummaryResponseSchema,
  AdminUserSchema,
  AdminUsersResponseSchema,
  GreatsEvidenceSchema,
  PrivacyRequestSchema,
  TierSignalSchema,
  UpdateSourceRequestSchema,
  UpdateUserRequestSchema,
} from '../schemas/admin-curation.schema';

export type AdminSummaryResponse = z.infer<typeof AdminSummaryResponseSchema>;
export type AdminDecisionRequest = z.infer<typeof AdminDecisionRequestSchema>;
export type TierSignal = z.infer<typeof TierSignalSchema>;
export type GreatsEvidence = z.infer<typeof GreatsEvidenceSchema>;
export type AdminDossier = z.infer<typeof AdminDossierSchema>;
export type AdminUser = z.infer<typeof AdminUserSchema>;
export type AdminAuditEntry = z.infer<typeof AdminAuditEntrySchema>;
export type AdminUsersResponse = z.infer<typeof AdminUsersResponseSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type PrivacyRequest = z.infer<typeof PrivacyRequestSchema>;
export type AdminSource = z.infer<typeof AdminSourceSchema>;
export type AdminQueuedLink = z.infer<typeof AdminQueuedLinkSchema>;
export type AdminSourcesResponse = z.infer<typeof AdminSourcesResponseSchema>;
export type UpdateSourceRequest = z.infer<typeof UpdateSourceRequestSchema>;
export type AddCollectionLinksRequest = z.infer<typeof AddCollectionLinksRequestSchema>;
