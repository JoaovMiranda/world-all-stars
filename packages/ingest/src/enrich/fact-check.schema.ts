import { z } from 'zod';

/** Independent level-four review of a biography claim against its supplied source evidence. */
export const FactCheckOutputSchema = z.object({
  claims: z
    .array(
      z.object({
        text: z.string().min(3),
        status: z.enum(['supported', 'unsupported']),
        evidence_quote: z.string().min(10).max(400),
      }),
    )
    .min(1)
    .max(6),
});
