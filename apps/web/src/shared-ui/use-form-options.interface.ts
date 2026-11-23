import type { z } from 'zod';

export interface UseFormOptions<S extends z.ZodType> {
  /** Shared Zod schema (e.g. createCommentInputSchema(bannedWords)). `null` while its context loads. */
  schema: S | null;
  initialValues: z.input<S>;
}
