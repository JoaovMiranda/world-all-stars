import type { z } from 'zod';

import type {
  MergeCandidateSchema,
  MergeCandidatesResponseSchema,
  MergeFieldWinnerSchema,
  MergeHistoryItemSchema,
  MergeHistoryResponseSchema,
  MergePreviewFieldSchema,
  MergePreviewResponseSchema,
  MergeRequestSchema,
} from '../schemas/entity-merge.schema';

export type MergeCandidate = z.infer<typeof MergeCandidateSchema>;
export type MergeCandidatesResponse = z.infer<typeof MergeCandidatesResponseSchema>;
export type MergePreviewField = z.infer<typeof MergePreviewFieldSchema>;
export type MergePreviewResponse = z.infer<typeof MergePreviewResponseSchema>;
export type MergeFieldWinner = z.infer<typeof MergeFieldWinnerSchema>;
export type MergeRequest = z.infer<typeof MergeRequestSchema>;
export type MergeHistoryItem = z.infer<typeof MergeHistoryItemSchema>;
export type MergeHistoryResponse = z.infer<typeof MergeHistoryResponseSchema>;
