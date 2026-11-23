import type { ANALYSIS_DIMENSIONS } from '../consts/analysis.const';

/** One normalized dimension (0–100) of the analysis radar (doc 16). */
export type AnalysisDimension = (typeof ANALYSIS_DIMENSIONS)[number];
