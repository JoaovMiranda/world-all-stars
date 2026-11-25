import type { z } from 'zod';

import type {
  CommentSchema,
  CommentsQuerySchema,
  CommentsResponseSchema,
  CommentThreadSchema,
  EditCommentRequestSchema,
  EditCommentResponseSchema,
  PostCommentRequestSchema,
  ReactToCommentRequestSchema,
  ReactToCommentResponseSchema,
  ReportCommentRequestSchema,
  ReportCommentResponseSchema,
} from '../schemas/comment.schema';

export type CommentsQuery = z.input<typeof CommentsQuerySchema>;
export type Comment = z.infer<typeof CommentSchema>;
export type CommentThread = z.infer<typeof CommentThreadSchema>;
export type CommentsResponse = z.infer<typeof CommentsResponseSchema>;
export type PostCommentRequest = z.infer<typeof PostCommentRequestSchema>;
export type ReactToCommentRequest = z.infer<typeof ReactToCommentRequestSchema>;
export type ReactToCommentResponse = z.infer<typeof ReactToCommentResponseSchema>;
export type EditCommentRequest = z.infer<typeof EditCommentRequestSchema>;
export type EditCommentResponse = z.infer<typeof EditCommentResponseSchema>;
export type ReportCommentRequest = z.infer<typeof ReportCommentRequestSchema>;
export type ReportCommentResponse = z.infer<typeof ReportCommentResponseSchema>;
