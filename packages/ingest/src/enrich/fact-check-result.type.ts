import type { z } from 'zod';

import type { FactCheckOutputSchema } from './fact-check.schema';

/** Outcome of the fact-check stage: every claim supported with a literal quote, some unsupported, or an invalid answer. */
export type FactCheckResult =
  | { status: 'supported'; output: z.infer<typeof FactCheckOutputSchema>; tokensIn: number; tokensOut: number }
  | { status: 'unsupported'; output: z.infer<typeof FactCheckOutputSchema>; tokensIn: number; tokensOut: number }
  | { status: 'invalid'; tokensIn: number; tokensOut: number };
