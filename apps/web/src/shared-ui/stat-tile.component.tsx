import type { ReactNode } from 'react';

interface StatTileProps {
  label: string;
  value: ReactNode;
  /** Small line under the number (unit, record note). */
  hint?: ReactNode;
}

/** One KPI: label in small caps, big serif number, optional hint. Place inside <KpiGrid>. */
export function StatTile({ label, value, hint }: StatTileProps) {
  return (
    <div className="kpi">
      <span className="label">{label}</span>
      <div className="display-num">{value}</div>
      {hint && <small>{hint}</small>}
    </div>
  );
}
