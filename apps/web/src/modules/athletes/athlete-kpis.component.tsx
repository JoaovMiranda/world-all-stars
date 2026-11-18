import { useText } from '@/i18n/use-text.hook';
import { CountUp } from '@/shared-ui/count-up.component';
import { KpiGrid } from '@/shared-ui/kpi-grid.component';
import { StatTile } from '@/shared-ui/stat-tile.component';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { formatValue } from './sport-panels/sport-panel.helper';
import type { SportKpi } from './sport-panels/sport-panel.type';

/** Header KPIs from the sport panel (gold = achievement). */
export function AthleteKpis({ kpis }: { kpis: readonly SportKpi[] }) {
  const profileText = useText(ATHLETE_PROFILE_MESSAGES);
  if (!kpis.length) return null;
  return (
    <div className="athlete-kpis">
    <KpiGrid columns={kpis.length >= 4 ? 4 : (Math.max(kpis.length, 2) as 2 | 3)} label={profileText.hero.kpisLabel}>
      {kpis.map((k) => (
        <StatTile key={k.label} label={k.label} value={<span className={k.gold ? 'kpi-gold' : undefined}>{typeof k.value === 'number' ? <CountUp value={k.value} format={formatValue} /> : formatValue(k.value)}</span>} hint={k.hint} />
      ))}
    </KpiGrid>
    </div>
  );
}
