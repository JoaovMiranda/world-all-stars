import { z } from 'zod';

/**
 * Biography Enricher (§7.2 task 3, biography@7): original, factual text; every claim cites the ID of one numbered
 * sentence of SOURCE/FACTS (`evidence: "S3"`). A literal quote (`evidence` text or the legacy `evidence_quote`) is still
 * accepted and resolved by the tolerant comparison. The output is normalized to `{ text, evidence }`.
 */
export const BiographyOutputSchema = z.object({
  bio_en: z.string().min(40).max(1200),
  bio_pt: z.string().min(40).max(1300),
  bio_es: z.string().min(40).max(1300),
  claims: z
    .array(
      z
        .object({ text: z.string().min(3).max(300), evidence: z.string().min(1).max(600).optional(), evidence_quote: z.string().min(1).max(600).optional() })
        .refine((c) => (c.evidence ?? c.evidence_quote) !== undefined, 'evidence is required')
        .transform((c) => ({ text: c.text, evidence: (c.evidence ?? c.evidence_quote) as string })),
    )
    .min(1)
    .max(6),
});
