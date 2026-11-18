import type { ReactNode } from 'react';

import { CountUp } from './count-up.component';

interface StatTileProps {
  label: string;
  /** A plain number counts up when it scrolls into view; anything else is shown as is. */
  value: ReactNode;
  /** Small line under the number (unit, record note). */
  hint?: ReactNode;
}

/** One KPI: label in small caps, big serif number, optional hint. Place inside <KpiGrid>. */
export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <div className="display-num">{typeof value === 'number' ? <CountUp value={value} /> : value}</div>
      {hint && <small>{hint}</small>}
    </div>
  );
}
