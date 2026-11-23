import type { z } from 'zod';

import type {
  AdminCommentSchema,
  AdminCommentsResponseSchema,
  AdminContactMessageSchema,
  AdminInboxResponseSchema,
  AdminIngestionResponseSchema,
  AdminIngestionRunSchema,
  AdminSuggestionSchema,
  AiQueueItemSchema,
  CrawlerProposalSchema,
} from '../schemas/admin.schema';

export type CrawlerProposal = z.infer<typeof CrawlerProposalSchema>;
export type AdminIngestionRun = z.infer<typeof AdminIngestionRunSchema>;
export type AiQueueItem = z.infer<typeof AiQueueItemSchema>;
export type AdminIngestionResponse = z.infer<typeof AdminIngestionResponseSchema>;
export type AdminComment = z.infer<typeof AdminCommentSchema>;
export type AdminCommentsResponse = z.infer<typeof AdminCommentsResponseSchema>;
export type AdminSuggestion = z.infer<typeof AdminSuggestionSchema>;
export type AdminContactMessage = z.infer<typeof AdminContactMessageSchema>;
export type AdminInboxResponse = z.infer<typeof AdminInboxResponseSchema>;
