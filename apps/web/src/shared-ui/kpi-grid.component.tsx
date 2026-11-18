import { type CSSProperties, type ReactNode, useRef } from 'react';

import { useReveal } from './use-reveal.hook';

interface KpiGridProps {
  children: ReactNode;
  /** Columns on desktop (2 on phones). Default 4. */
  columns?: 2 | 3 | 4 | 5 | 6;
  label?: string;
}

/** Grid of StatTiles separated by 1px rules (doc 08 "painel de dados"). */
export function KpiGrid({ children, columns = 4, label }: KpiGridProps) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, { stagger: true });
  return (
    <div ref={ref} className="kpis" style={{ '--kpi-cols': columns } as CSSProperties} role={label ? 'group' : undefined} aria-label={label}>
      {children}
    </div>
  );
}
