import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { OkResponseSchema } from '../schemas/api-error.schema';
import { AthleteSlugParamsSchema } from '../schemas/athlete-profile.schema';
import {
  CommentIdParamsSchema,
  CommentsQuerySchema,
  CommentsResponseSchema,
  PostCommentRequestSchema,
  PostCommentResponseSchema,
  ReactToCommentRequestSchema,
  ReactToCommentResponseSchema,
} from '../schemas/comment.schema';
import { ContactRequestSchema, SubmissionResponseSchema, SuggestionRequestSchema } from '../schemas/contact.schema';
import {
  ConsentPurposeParamsSchema,
  ConsentSchema,
  DeleteAccountRequestSchema,
  DeleteAccountResponseSchema,
  MyDataExportSchema,
  MyDataResponseSchema,
  UpdateConsentRequestSchema,
} from '../schemas/my-data.schema';
import {
  MeResponseSchema,
  NotificationIdParamsSchema,
  NotificationsResponseSchema,
  SessionResponseSchema,
} from '../schemas/session.schema';
import {
  CastTierVoteRequestSchema,
  CastTierVoteResponseSchema,
  TierVotesResponseSchema,
} from '../schemas/tier-vote.schema';

/** Votes, comments, contact/suggestion, session and account (docs 17, 20, 21). */
export const ParticipationApi = {
  session: defineContract({ method: HttpMethod.Get, access: ApiAccess.Public, path: '/api/session', summary: 'Current session', response: SessionResponseSchema }),
  me: defineContract({ method: HttpMethod.Get, access: ApiAccess.Reader, path: '/api/me', summary: 'My votes and comments (E2)', response: MeResponseSchema }),
  notifications: defineContract({ method: HttpMethod.Get, access: ApiAccess.Reader, path: '/api/notifications', summary: 'My notifications (E4)', response: NotificationsResponseSchema }),
  markNotificationRead: defineContract({ method: HttpMethod.Patch, access: ApiAccess.Reader, path: '/api/notifications/:id/read', summary: 'Mark a notification as read', params: NotificationIdParamsSchema, response: OkResponseSchema }),
  tierVotes: defineContract({ method: HttpMethod.Get, access: ApiAccess.Reader, path: '/api/athletes/:slug/tier-votes', summary: 'Tier vote counts (counts only for signed-in users)', params: AthleteSlugParamsSchema, response: TierVotesResponseSchema }),
  castTierVote: defineContract({ method: HttpMethod.Put, access: ApiAccess.Reader, path: '/api/athletes/:slug/tier-vote', summary: 'Create or change my tier vote', params: AthleteSlugParamsSchema, body: CastTierVoteRequestSchema, response: CastTierVoteResponseSchema }),
  comments: defineContract({ method: HttpMethod.Get, access: ApiAccess.Public, path: '/api/athletes/:slug/comments', summary: 'Comment threads', params: AthleteSlugParamsSchema, query: CommentsQuerySchema, response: CommentsResponseSchema }),
  postComment: defineContract({ method: HttpMethod.Post, access: ApiAccess.Reader, path: '/api/athletes/:slug/comments', summary: 'Post a comment or reply', params: AthleteSlugParamsSchema, body: PostCommentRequestSchema, response: PostCommentResponseSchema }),
  reactToComment: defineContract({ method: HttpMethod.Put, access: ApiAccess.Reader, path: '/api/comments/:id/reaction', summary: 'Like/dislike/undo', params: CommentIdParamsSchema, body: ReactToCommentRequestSchema, response: ReactToCommentResponseSchema }),
  deleteComment: defineContract({ method: HttpMethod.Delete, access: ApiAccess.Reader, path: '/api/comments/:id', summary: 'Soft delete my comment', params: CommentIdParamsSchema, response: OkResponseSchema }),
  submitSuggestion: defineContract({ method: HttpMethod.Post, access: ApiAccess.Public, path: '/api/suggestions', summary: 'Suggest an athlete with source links', body: SuggestionRequestSchema, response: SubmissionResponseSchema }),
  myData: defineContract({ method: HttpMethod.Get, access: ApiAccess.Reader, path: '/api/me/data', summary: 'Terms acceptances and optional consents (E6)', response: MyDataResponseSchema }),
  updateConsent: defineContract({ method: HttpMethod.Put, access: ApiAccess.Reader, path: '/api/me/consents/:purpose', summary: 'Grant or revoke an optional consent (E6)', params: ConsentPurposeParamsSchema, body: UpdateConsentRequestSchema, response: ConsentSchema }),
  exportMyData: defineContract({ method: HttpMethod.Post, access: ApiAccess.Reader, path: '/api/me/export', summary: 'Export my data as JSON (LGPD portability, E6)', response: MyDataExportSchema }),
  deleteAccount: defineContract({ method: HttpMethod.Delete, access: ApiAccess.Reader, path: '/api/me', summary: 'Delete my account (anonymization, E6)', body: DeleteAccountRequestSchema, response: DeleteAccountResponseSchema }),
  submitContact: defineContract({ method: HttpMethod.Post, access: ApiAccess.Public, path: '/api/contact', summary: 'Message to the curators', body: ContactRequestSchema, response: SubmissionResponseSchema }),
} as const;
