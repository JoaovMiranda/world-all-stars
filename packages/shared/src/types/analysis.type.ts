import type { z } from 'zod';

import type { AnalysisDimensionsResponseSchema, AnalysisScoresSchema, CompareQuerySchema, CompareResponseSchema } from '../schemas/analysis.schema';

export type AnalysisScores = z.infer<typeof AnalysisScoresSchema>;
export type AnalysisDimensionsResponse = z.infer<typeof AnalysisDimensionsResponseSchema>;
export type CompareQuery = z.input<typeof CompareQuerySchema>;
export type CompareResponse = z.infer<typeof CompareResponseSchema>;
