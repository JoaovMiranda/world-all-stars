import { z } from 'zod';

/** One run of the AI-assisted collection (docs 11 and 18): how many sources passed each gate and the token cost. */
export const CollectionRunSchema = z.object({
  startedAt: z.iso.datetime(),
  mode: z.string().min(1),
  /** Sources whose revision was checked (gate 1). */
  checked: z.number().int().nonnegative(),
  /** Same revision as the last run: the extractor is not called (0 tokens). */
  unchanged: z.number().int().nonnegative(),
  /** Sources sent to the extractor and validated. */
  validated: z.number().int().nonnegative(),
  /** Facts whose evidence_quote exists literally in the source. */
  factsAccepted: z.number().int().nonnegative(),
  /** Facts discarded by the literal-quote check or forbidden sources. */
  factsRejected: z.number().int().nonnegative(),
  extractorTokens: z.number().int().nonnegative(),
});
export type CollectionRun = z.infer<typeof CollectionRunSchema>;

/** Response of GET /api/collection-runs (newest last, as executed). */
export const CollectionRunsResponseSchema = z.array(CollectionRunSchema);
