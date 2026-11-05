import { z } from 'zod';

/** Highlighted KPI of the sport panel (crawler-provided label and hint). */
export const StatKpiSchema = z.object({
  label_pt: z.string().min(1),
  value: z.union([z.number(), z.string()]),
  hint_pt: z.string().nullable().optional(),
});
export type StatKpi = z.infer<typeof StatKpiSchema>;

/**
 * Sport-specific career stats (athlete_stats.stats, JSONB). Loose record keyed by `schema` (football, swimming…):
 * each sport panel narrows what it reads. `_kpis` and `_labels` are generic presentation hints.
 */
export const AthleteStatsSchema = z
  .object({
    schema: z.string().min(1),
    _kpis: z.array(StatKpiSchema).optional(),
    _labels: z.record(z.string(), z.string()).optional(),
  })
  .catchall(z.unknown());
export type AthleteStats = z.infer<typeof AthleteStatsSchema>;
