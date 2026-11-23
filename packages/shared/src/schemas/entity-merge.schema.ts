// Merge/unmerge of two competitors (handoff T1.3, D14): candidates search, side-by-side preview, merge with per-field
// winners and a required reason, history with exact unmerge.
import { z } from 'zod';

const Id = z.string().min(1);
const Reason = z.string().trim().min(3).max(500);

export const MergeCandidatesQuerySchema = z.object({ q: z.string().trim().max(100).optional() });
export const MergeCandidateSchema = z.object({ id: Id, slug: z.string().min(1), name: z.string().min(1) });
export const MergeCandidatesResponseSchema = z.object({ items: z.array(MergeCandidateSchema) });

/** One value of one side: the value as text (null = empty) and where it came from (provenance or writer). */
export const MergeFieldValueSchema = z.object({ value: z.string().nullable(), source: z.string().min(1) });
export const MergePreviewFieldSchema = z.object({ field: z.string().min(1), survivor: MergeFieldValueSchema, merged: MergeFieldValueSchema });
export const MergePreviewRequestSchema = z.object({ survivorId: Id, mergedId: Id });
export const MergePreviewResponseSchema = z.object({
  survivor: MergeCandidateSchema,
  merged: MergeCandidateSchema,
  fields: z.array(MergePreviewFieldSchema),
});

/** Which side wins a field: the survivor keeps its own value unless the admin picks the merged one. */
export const MergeFieldWinnerSchema = z.enum(['survivor', 'merged']);
export const MergeRequestSchema = z.object({
  survivorId: Id,
  mergedId: Id,
  reason: Reason,
  fieldChoices: z.record(z.string(), MergeFieldWinnerSchema).default({}),
});
export const MergeResponseSchema = z.object({ id: Id });

export const UnmergeRequestSchema = z.object({ reason: Reason });

export const MergeHistoryItemSchema = z.object({
  id: Id,
  survivor: MergeCandidateSchema,
  merged: MergeCandidateSchema,
  reason: z.string(),
  mergedAt: z.iso.datetime(),
  undoneAt: z.iso.datetime().nullable(),
  undoReason: z.string().nullable(),
  /** Number of re-pointed rows (all tables). */
  moved: z.number().int().nonnegative(),
});
export const MergeHistoryResponseSchema = z.object({ items: z.array(MergeHistoryItemSchema) });
