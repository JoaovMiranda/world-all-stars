import type { z } from 'zod';

import type { FactCheckOutputSchema } from './fact-check.schema';

/**
 * Outcome of the fact-check stage: every claim supported by a resolvable sentence, some unsupported, or an invalid
 * answer. `evidence` holds the literal sentence (or exact span) each verdict cites, in claim order (null = none).
 */
export type FactCheckResult =
  | {
      status: 'supported';
      output: z.infer<typeof FactCheckOutputSchema>;
      evidence: (string | null)[];
      unsupported: string[];
      tokensIn: number;
      tokensOut: number;
    }
  | {
      status: 'unsupported';
      output: z.infer<typeof FactCheckOutputSchema>;
      evidence: (string | null)[];
      unsupported: string[];
      tokensIn: number;
      tokensOut: number;
    }
  | { status: 'invalid'; tokensIn: number; tokensOut: number };
