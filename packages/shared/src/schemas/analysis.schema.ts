import { z } from 'zod';

import { ANALYSIS_DIMENSIONS, ANALYSIS_MAX_ATHLETES } from '../consts/analysis.const';
import { AthleteSummarySchema } from './athlete-summary.schema';

const dims = z.object(Object.fromEntries(ANALYSIS_DIMENSIONS.map((k) => [k, z.number()])) as Record<(typeof ANALYSIS_DIMENSIONS)[number], z.ZodNumber>);

/** Raw values and log-normalized scores (0–100) of one athlete (doc 16). */
export const AnalysisScoresSchema = z.object({ raw: dims, norm: dims });
export type AnalysisScores = z.infer<typeof AnalysisScoresSchema>;

/** Response of GET /api/analysis/dimensions: normalization basis for every registered athlete. */
export const AnalysisDimensionsResponseSchema = z.object({
  keys: z.array(z.enum(ANALYSIS_DIMENSIONS)),
  max: dims,
  bySlug: z.record(z.string(), AnalysisScoresSchema),
});
export type AnalysisDimensionsResponse = z.infer<typeof AnalysisDimensionsResponseSchema>;

/** Query of GET /api/compare?slugs=a,b (Analysis tab, up to 5 athletes). */
export const CompareQuerySchema = z.object({
  slugs: z
    .string()
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(z.string().min(1)).max(ANALYSIS_MAX_ATHLETES)),
});
export type CompareQuery = z.input<typeof CompareQuerySchema>;

/** Response of GET /api/compare. */
export const CompareResponseSchema = z.object({
  athletes: z.array(AthleteSummarySchema.extend({ scores: AnalysisScoresSchema })),
  max: dims,
});
export type CompareResponse = z.infer<typeof CompareResponseSchema>;
