import { type AthleteStats, AthleteStatsSchema } from '@was/shared';
import type { z } from 'zod';
import { GenericPanel } from './generic-panel.component';
import { statEntries } from './generic-panel.helper';
import { kpi, metric, titleKpis, titleMetrics } from './sport-panel.helper';
import type { SportPanelDef } from './sport-panel.type';

export const GENERIC_PANEL: SportPanelDef<AthleteStats | null> = {
  schema: AthleteStatsSchema.nullable() as z.ZodType<AthleteStats | null>,
  kpis: (p, s) => [...(s?._kpis ?? []).slice(0, 2).map((k) => kpi(k.label_pt, k.value, k.hint_pt ?? undefined)), ...titleKpis(p)].slice(0, 4),
  compare: (p, s) => [
    ...titleMetrics(p),
    ...statEntries(s)
      .filter((e) => typeof e.raw === 'number')
      .slice(0, 6)
      .map((e) => metric(e.label, e.raw as number)),
  ],
  Panel: GenericPanel,
};
