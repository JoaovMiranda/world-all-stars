import './meter-list.css';

import type { CSSProperties } from 'react';

import { cx } from './class-names.helper';
import type { MeterItem } from './meter-item.interface';

/** List of label · bar · value rows (tier vote shares, distributions). The bar is decorative: the value is text. */
export function MeterList({ items, label }: { items: readonly MeterItem[]; label?: string }) {
  return (
    <ul className="meter-list" aria-label={label}>
      {items.map((m, i) => (
        <li key={m.key} className={cx('meter-row', m.emphasis && 'is-emphasis')}>
          <span className="meter-label">{m.label}</span>
          <span className="meter-track" aria-hidden="true">
            <span
              className="meter-fill"
              style={{ '--pct': `${Math.max(0, Math.min(100, m.percent))}%`, '--i': i, ...(m.fill ? { '--meter-fill': m.fill } : {}) } as CSSProperties}
            />
          </span>
          <span className="meter-value">{m.valueText}</span>
        </li>
      ))}
    </ul>
  );
}
