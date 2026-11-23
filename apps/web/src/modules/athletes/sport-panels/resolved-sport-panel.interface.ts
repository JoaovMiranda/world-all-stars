import type { ReactNode } from 'react';
import type { CompareMetric, SportKpi } from './sport-panel.type';

/** A sport panel bound to one profile: header KPIs, same-sport metrics and the Overview card. */
export interface ResolvedSportPanel {
  kpis: SportKpi[];
  compare: CompareMetric[];
  panel: ReactNode;
}
