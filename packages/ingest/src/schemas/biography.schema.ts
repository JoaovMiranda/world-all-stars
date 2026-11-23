import { z } from 'zod';

/** Biography Enricher (§7.2 task 3): original, factual text; every claim cites a literal quote of the source. */
export const BiographyOutputSchema = z.object({
  bio_en: z.string().min(40).max(1200),
  bio_pt: z.string().min(40).max(1300),
  bio_es: z.string().min(40).max(1300),
  claims: z
    .array(z.object({ text: z.string().min(3), evidence_quote: z.string().min(10).max(400) }))
    .min(1)
    .max(6),
});
