import { KpiGrid } from '@/shared-ui/kpi-grid.component';
import { StatTile } from '@/shared-ui/stat-tile.component';

import { ATHLETE_PROFILE_TEXT } from './athletes.const';
import { formatValue } from './sport-panels/sport-panel.helper';
import type { SportKpi } from './sport-panels/sport-panel.type';

/** Header KPIs from the sport panel (gold = achievement). */
export function AthleteKpis({ kpis }: { kpis: readonly SportKpi[] }) {
  if (!kpis.length) return null;
  return (
    <div className="athlete-kpis">
    <KpiGrid columns={kpis.length >= 4 ? 4 : (Math.max(kpis.length, 2) as 2 | 3)} label={ATHLETE_PROFILE_TEXT.hero.kpisLabel}>
      {kpis.map((k) => (
        <StatTile key={k.label} label={k.label} value={<span className={k.gold ? 'kpi-gold' : undefined}>{formatValue(k.value)}</span>} hint={k.hint} />
      ))}
    </KpiGrid>
    </div>
  );
}
