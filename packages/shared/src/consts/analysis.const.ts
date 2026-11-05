/** The Analysis tab compares at most 5 athletes (doc 09 P2). */
export const ANALYSIS_MAX_ATHLETES = 5;
/** Normalized dimensions (0–100) of the analysis radar (doc 16). */
export const ANALYSIS_DIMENSIONS = ['worldTitles', 'awards', 'longevity', 'dominance', 'breadth', 'legacy'] as const;
export type AnalysisDimension = (typeof ANALYSIS_DIMENSIONS)[number];
