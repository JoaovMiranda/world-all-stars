import { ANALYSIS_DIMENSIONS, type AnalysisDimension } from '../consts/analysis.const';
import type { AnalysisDimensionsResponse, CompareResponse } from '../types/analysis.type';
import type { AthleteSummary } from '../types/athlete-summary.type';

type Dims = Record<AnalysisDimension, number>;

/**
 * Normalizes raw analysis values (doc 16): each dimension against the max among registered athletes, on a log
 * scale (medals per event in swimming would flatten every other sport); `legacy` is already a percentile.
 */
export const normalizeAnalysis = (raw: readonly { slug: string; values: Dims }[]): AnalysisDimensionsResponse => {
  const max = Object.fromEntries(ANALYSIS_DIMENSIONS.map((k) => [k, Math.max(0, ...raw.map((r) => r.values[k])) || 1])) as Dims;
  const scale = (v: number, m: number) => Math.round((Math.log1p(v) / Math.log1p(m)) * 100);
  return {
    keys: [...ANALYSIS_DIMENSIONS],
    max,
    bySlug: Object.fromEntries(
      raw.map((r) => [
        r.slug,
        { raw: r.values, norm: Object.fromEntries(ANALYSIS_DIMENSIONS.map((k) => [k, k === 'legacy' ? r.values[k] : scale(r.values[k], max[k])])) as Dims },
      ]),
    ),
  };
};

/** GET /api/compare: the requested athletes (in order, unknown slugs skipped) with their scores. */
export const composeCompare = (slugs: readonly string[], athletes: readonly AthleteSummary[], dims: AnalysisDimensionsResponse): CompareResponse => ({
  athletes: slugs.flatMap((slug) => {
    const a = athletes.find((x) => x.slug === slug);
    const scores = dims.bySlug[slug];
    return a && scores ? [{ ...a, scores }] : [];
  }),
  max: dims.max,
});
