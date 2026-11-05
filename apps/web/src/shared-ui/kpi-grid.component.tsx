import type { CSSProperties, ReactNode } from 'react';

interface KpiGridProps {
  children: ReactNode;
  /** Columns on desktop (2 on phones). Default 4. */
  columns?: 2 | 3 | 4 | 5 | 6;
  label?: string;
}

/** Grid of StatTiles separated by 1px rules (doc 08 "painel de dados"). */
export function KpiGrid({ children, columns = 4, label }: KpiGridProps) {
  return (
    <div className="kpis" style={{ '--kpi-cols': columns } as CSSProperties} role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  );
}
