import './meter-list.css';

import type { CSSProperties, ReactNode } from 'react';

import { cx } from './class-names.helper';

export interface MeterItem {
  key: string;
  label: ReactNode;
  /** Filled share, 0–100. */
  percent: number;
  /** Visible value on the right ("12 · 48%"). */
  valueText: ReactNode;
  /** CSS background of the fill (token or gradient: `var(--grad-gold)`). Default: primary. */
  fill?: string;
  /** Bold label (e.g. the official option). */
  emphasis?: boolean;
}

/** List of label · bar · value rows (tier vote shares, distributions). The bar is decorative: the value is text. */
export function MeterList({ items, label }: { items: readonly MeterItem[]; label?: string }) {
  return (
    <ul className="meter-list" aria-label={label}>
      {items.map((m, i) => (
        <li key={m.key} className={cx('meter-row', m.emphasis && 'is-emphasis')}>
          <span className="meter-label">{m.label}</span>
          <span className="meter-track" aria-hidden="true">
            <span className="meter-fill" style={{ '--pct': `${Math.max(0, Math.min(100, m.percent))}%`, '--i': i, ...(m.fill ? { '--meter-fill': m.fill } : {}) } as CSSProperties} />
          </span>
          <span className="meter-value">{m.valueText}</span>
        </li>
      ))}
    </ul>
  );
}
