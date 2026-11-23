import { z } from 'zod';

import { ADMIN_REASON_MIN_LENGTH, COLLECTION_LINKS_MAX } from '../consts/admin-rules.const';
import { ADMIN_AUDIT_ACTION_VALUES } from '../enums/admin-audit-action.enum';
import { ADMIN_DECISION_VALUES } from '../enums/admin-decision.enum';
import { ADMIN_SECTION_VALUES } from '../enums/admin-section.enum';
import { CONTACT_STATUS_VALUES } from '../enums/contact-status.enum';
import { DOSSIER_STATUS_VALUES } from '../enums/dossier-status.enum';
import { GREATS_EVIDENCE_TYPE_VALUES } from '../enums/greats-evidence-type.enum';
import { PRIVACY_REQUEST_STATUS_VALUES } from '../enums/privacy-request-status.enum';
import { PRIVACY_RIGHT_VALUES } from '../enums/privacy-right.enum';
import { PRIVACY_SUBJECT_KIND_VALUES } from '../enums/privacy-subject-kind.enum';
import { SOURCE_USAGE_STATUS_VALUES } from '../enums/source-usage-status.enum';
import { TIER_VALUES } from '../enums/tier.enum';
import { USER_ROLE_VALUES } from '../enums/user-role.enum';
import { AthleteRefSchema } from './athlete-summary.schema';
import { SourceOverviewSchema } from './source-overview.schema';
import { SourceRefSchema } from './source-ref.schema';

const tier = z.enum(TIER_VALUES);
const count = z.number().int().nonnegative();
/** Reason an admin must write for a decision (kept in the audit log). */
export const AdminReasonSchema = z.string().trim().min(ADMIN_REASON_MIN_LENGTH).max(500);

/** Painel: pending items per section (badges of the admin navigation). */
export const AdminSummaryResponseSchema = z.object({ pending: z.record(z.enum(ADMIN_SECTION_VALUES), count) });

/** Body of every approve/reject decision (proposal, dossier). */
export const AdminDecisionRequestSchema = z.object({ decision: z.enum(ADMIN_DECISION_VALUES), reason: AdminReasonSchema });

/** A1 · "Sinais de tier": votes of the readers against the official tier (doc 17). */
export const TierSignalSchema = z.object({
  athlete: AthleteRefSchema,
  official: tier,
  counts: z.record(tier, count),
  total: count,
  mostVoted: tier.nullable(),
  topOther: tier.nullable(),
  topOtherShare: z.number().min(0).max(1),
  isSignal: z.boolean(),
});
export const TierSignalsResponseSchema = z.object({ items: z.array(TierSignalSchema) });

/** A6 · "Mudou o jogo" dossier with its evidences (each one with a source) and the 2-admin approval. */
export const GreatsEvidenceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(GREATS_EVIDENCE_TYPE_VALUES),
  description: z.string().nullable(),
  source: SourceRefSchema.nullable(),
});
export const AdminDossierSchema = z.object({
  id: z.string().min(1),
  athlete: AthleteRefSchema,
  headline: z.string(),
  status: z.enum(DOSSIER_STATUS_VALUES),
  approvalsRequired: z.number().int().positive(),
  approvedBy: z.array(z.string().min(1)),
  reviewNote: z.string().nullable(),
  evidences: z.array(GreatsEvidenceSchema),
  updatedAt: z.iso.datetime(),
});
export const AdminDossiersResponseSchema = z.object({ items: z.array(AdminDossierSchema) });

/** A4 · Accounts, roles and the audit log of admin actions. */
export const AdminUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  email: z.string().min(3),
  role: z.enum(USER_ROLE_VALUES),
  bannedAt: z.iso.datetime().nullable(),
  banReason: z.string().nullable(),
  tierVotesCount: count,
  commentsCount: count,
  createdAt: z.iso.datetime(),
});
export const AdminAuditEntrySchema = z.object({
  id: z.string().min(1),
  at: z.iso.datetime(),
  actor: z.string().min(1),
  action: z.enum(ADMIN_AUDIT_ACTION_VALUES),
  target: z.string().min(1),
  reason: z.string().nullable(),
});
export const AdminUsersResponseSchema = z.object({ items: z.array(AdminUserSchema), audit: z.array(AdminAuditEntrySchema) });
export const UpdateUserRequestSchema = z.object({ role: z.enum(USER_ROLE_VALUES).optional(), banned: z.boolean().optional(), reason: AdminReasonSchema });

/** A5 · Privacy requests (LGPD) from users, athletes and heirs, with legal deadline (doc 13). */
export const PrivacyRequestSchema = z.object({
  id: z.string().min(1),
  protocol: z.string().min(1),
  requesterEmail: z.string().min(3),
  subjectKind: z.enum(PRIVACY_SUBJECT_KIND_VALUES),
  right: z.enum(PRIVACY_RIGHT_VALUES),
  athlete: AthleteRefSchema.nullable(),
  details: z.string(),
  status: z.enum(PRIVACY_REQUEST_STATUS_VALUES),
  createdAt: z.iso.datetime(),
  dueAt: z.iso.datetime(),
  answeredAt: z.iso.datetime().nullable(),
  handledBy: z.string().nullable(),
  note: z.string().nullable(),
});
export const AdminPrivacyResponseSchema = z.object({ items: z.array(PrivacyRequestSchema) });
export const UpdatePrivacyRequestSchema = z.object({ status: z.enum(PRIVACY_REQUEST_STATUS_VALUES), note: AdminReasonSchema });

/** A3 · Source registry (usage status, license review) + links queued for the next collection. */
export const AdminSourceSchema = SourceOverviewSchema.extend({ licenseReviewedAt: z.iso.datetime().nullable() });
export const AdminQueuedLinkSchema = z.object({
  id: z.string().min(1),
  athleteName: z.string().min(1),
  sport: z.string().nullable(),
  url: z.url(),
  sourceName: z.string().nullable(),
  origin: z.enum(['admin', 'suggestion']),
  createdAt: z.iso.datetime(),
});
export const AdminSourcesResponseSchema = z.object({ sources: z.array(AdminSourceSchema), queuedLinks: z.array(AdminQueuedLinkSchema) });
export const UpdateSourceRequestSchema = z.object({
  usageStatus: z.enum(SOURCE_USAGE_STATUS_VALUES).optional(),
  licenseReviewed: z.boolean().optional(),
  reason: AdminReasonSchema,
});
/** Body of POST /api/admin/source-links: athlete + 1–3 links (re-checked with checkSourceUrl on the server). */
export const AddCollectionLinksRequestSchema = z.object({
  athleteName: z.string().trim().min(2).max(120),
  sport: z.string().trim().max(60).optional(),
  urls: z.array(z.string().trim().min(1)).min(1).max(COLLECTION_LINKS_MAX),
});

/** A8 · Status of a contact message. */
export const UpdateContactMessageRequestSchema = z.object({ status: z.enum(CONTACT_STATUS_VALUES) });
/** A2 · 'Run now' (pt-BR UI: "Rodar agora"), simulated. */
export const RunIngestionRequestSchema = z.object({
  jobKey: z.string().min(1),
  /** collect.list: names, links or CSV lines (Phase 13). */ names: z.string().max(20_000).optional(),
});
/** A7 · Banned word key in the URL (DELETE /api/admin/banned-words/:locale/:term). */
export const BannedWordKeyParamsSchema = z.object({ locale: z.string().min(2), term: z.string().min(1) });
