import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import {
  AdminCommentsResponseSchema,
  AdminInboxResponseSchema,
  AdminIngestionResponseSchema,
  CrawlerProposalsResponseSchema,
  ModerateCommentRequestSchema,
  ReviewSuggestionRequestSchema,
} from '../schemas/admin.schema';
import {
  AddCollectionLinksRequestSchema,
  AdminDecisionRequestSchema,
  AdminDossiersResponseSchema,
  AdminPrivacyResponseSchema,
  AdminSourcesResponseSchema,
  AdminSummaryResponseSchema,
  AdminUsersResponseSchema,
  BannedWordKeyParamsSchema,
  RunIngestionRequestSchema,
  TierSignalsResponseSchema,
  UpdateContactMessageRequestSchema,
  UpdatePrivacyRequestSchema,
  UpdateSourceRequestSchema,
  UpdateUserRequestSchema,
} from '../schemas/admin-curation.schema';
import { AdminIdentitiesResponseSchema, DecideIdentityRequestSchema } from '../schemas/admin-identity.schema';
import { OkResponseSchema } from '../schemas/api-error.schema';
import { BannedWordSchema } from '../schemas/moderation-rules.schema';
import { AthleteSlugParamsSchema } from '../schemas/athlete-profile.schema';
import { CommentIdParamsSchema } from '../schemas/comment.schema';
import { SetOfficialTierRequestSchema, SetOfficialTierResponseSchema } from '../schemas/tier-vote.schema';
import { z } from 'zod';

const admin = { access: ApiAccess.Admin } as const;
const IdParams = z.object({ id: z.string().min(1) });

/** Admin queues (doc 09 A1–A8). */
export const AdminApi = {
  proposals: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/proposals', summary: 'Crawler/AI proposals and conflicts (A1)', response: CrawlerProposalsResponseSchema }),
  ingestion: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/ingestion-runs', summary: 'Ingestion runs (A2)', response: AdminIngestionResponseSchema }),
  comments: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/comments', summary: 'Comments moderation queue + banned words (A7)', response: AdminCommentsResponseSchema }),
  moderateComment: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/comments/:id', summary: 'Hide/show a comment with reason', params: CommentIdParamsSchema, body: ModerateCommentRequestSchema, response: OkResponseSchema }),
  inbox: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/inbox', summary: 'Suggestions and contact messages (A8)', response: AdminInboxResponseSchema }),
  reviewSuggestion: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/suggestions/:id', summary: 'Approve/reject/mark duplicate', params: IdParams, body: ReviewSuggestionRequestSchema, response: OkResponseSchema }),
  summary: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/summary', summary: 'Pending items per admin section (navigation badges)', response: AdminSummaryResponseSchema }),
  reviewProposal: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/proposals/:id', summary: 'Approve/reject a crawler or AI proposal with reason (A1)', params: IdParams, body: AdminDecisionRequestSchema, response: OkResponseSchema }),
  identities: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/identities', summary: 'Identity review queue: ambiguous competitors (A1, handoff v3 §7.1)', response: AdminIdentitiesResponseSchema }),
  decideIdentity: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/identities/:id', summary: 'Match / create / reject an ambiguous identity with reason', params: IdParams, body: DecideIdentityRequestSchema, response: OkResponseSchema }),
  tierSignals: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/tier-signals', summary: 'Reader votes vs official tier (A1, doc 17)', response: TierSignalsResponseSchema }),
  runIngestion: defineContract({ ...admin, method: HttpMethod.Post, path: '/api/admin/ingestion-runs', summary: 'Run a job now (A2)', body: RunIngestionRequestSchema, response: OkResponseSchema }),
  sources: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/sources', summary: 'Source registry + links queued for collection (A3)', response: AdminSourcesResponseSchema }),
  updateSource: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/sources/:id', summary: 'Activate/deactivate a source or mark its license reviewed (A3)', params: IdParams, body: UpdateSourceRequestSchema, response: OkResponseSchema }),
  addCollectionLinks: defineContract({ ...admin, method: HttpMethod.Post, path: '/api/admin/source-links', summary: 'Add an athlete and links to the collection (A3)', body: AddCollectionLinksRequestSchema, response: OkResponseSchema }),
  users: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/users', summary: 'Accounts, roles and audit log (A4)', response: AdminUsersResponseSchema }),
  updateUser: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/users/:id', summary: 'Promote/demote/ban/unban with reason (A4)', params: IdParams, body: UpdateUserRequestSchema, response: OkResponseSchema }),
  privacyRequests: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/privacy-requests', summary: 'LGPD requests with deadline (A5)', response: AdminPrivacyResponseSchema }),
  updatePrivacyRequest: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/privacy-requests/:id', summary: 'Change the status of a privacy request with a note (A5)', params: IdParams, body: UpdatePrivacyRequestSchema, response: OkResponseSchema }),
  dossiers: defineContract({ ...admin, method: HttpMethod.Get, path: '/api/admin/dossiers', summary: '"Mudou o jogo" dossiers and their approvals (A6)', response: AdminDossiersResponseSchema }),
  reviewDossier: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/dossiers/:id', summary: 'Approve (1 of 2) or reject a dossier with reason (A6)', params: IdParams, body: AdminDecisionRequestSchema, response: OkResponseSchema }),
  addBannedWord: defineContract({ ...admin, method: HttpMethod.Post, path: '/api/admin/banned-words', summary: 'Add a banned word (A7)', body: BannedWordSchema, response: OkResponseSchema }),
  removeBannedWord: defineContract({ ...admin, method: HttpMethod.Delete, path: '/api/admin/banned-words/:locale/:term', summary: 'Remove a banned word (A7)', params: BannedWordKeyParamsSchema, response: OkResponseSchema }),
  updateContactMessage: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/contact/:id', summary: 'Mark a message as answered/closed (A8)', params: IdParams, body: UpdateContactMessageRequestSchema, response: OkResponseSchema }),
  setOfficialTier: defineContract({ ...admin, method: HttpMethod.Patch, path: '/api/admin/athletes/:slug/tier', summary: 'Change the official tier (reason required)', params: AthleteSlugParamsSchema, body: SetOfficialTierRequestSchema, response: SetOfficialTierResponseSchema }),
} as const;
