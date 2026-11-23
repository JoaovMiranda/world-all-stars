import { z } from 'zod';

/** Career/achievement extraction contract (subset of EXTRACTION_CONTRACT.md, output in English). */
export const ExtractedFactSchema = z.object({
  field: z.string().min(1),
  value: z.union([z.string(), z.number()]),
  year: z.number().int().nullable().default(null),
  evidence_quote: z.string().min(10).max(400),
});
export const ExtractionOutputSchema = z.object({ facts: z.array(ExtractedFactSchema).max(50) });
