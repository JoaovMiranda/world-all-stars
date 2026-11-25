import { z } from 'zod';

/**
 * Independent level-four review of biography claims (fact-check@2): one verdict per claim (`claim: "C1"`) with the ID
 * of the supporting sentence (`evidence: "S3"`). A quote text (`evidence` or legacy `evidence_quote`) is resolved by the
 * tolerant comparison; a missing `claim` ID falls back to the answer's order.
 */
export const FactCheckOutputSchema = z.object({
  claims: z
    .array(
      z.object({
        claim: z.string().max(10).optional(),
        text: z.string().optional(),
        status: z.enum(['supported', 'unsupported']),
        evidence: z.string().min(1).max(600).optional(),
        evidence_quote: z.string().min(1).max(600).optional(),
      }),
    )
    .min(1)
    .max(6),
});
