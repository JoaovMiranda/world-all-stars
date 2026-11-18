import './range-bars.css';

import { type ReactNode, useRef } from 'react';

import { useReveal } from './use-reveal.hook';

export interface RangeBarItem {
  key: string;
  label: ReactNode;
  /** Start and end on the axis unit (years). */
  from: number;
  to: number;
  /** Text inside the bar (e.g. "1956–1974"). */
  text: string;
  /** Long description (tooltip + screen readers). */
  description?: string;
  tone?: 'primary' | 'accent' | 'success';
}

interface RangeBarsProps {
  items: readonly RangeBarItem[];
  /** Axis bounds (default: min/max of the items). */
  min?: number;
  max?: number;
  label?: string;
}

/** Gantt rows on one shared axis (career at each team, title reigns). Each bar keeps its text for assistive tech. */
export function RangeBars({ items, min, max, label }: RangeBarsProps) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref, { stagger: true, settleMs: 2400 });
  if (!items.length) return null;
  const from = min ?? Math.min(...items.map((i) => i.from));
  const to = max ?? Math.max(...items.map((i) => i.to));
  const span = Math.max(to - from + 1, 1);
  return (
    <div ref={ref} className="range-bars" role="list" aria-label={label}>
      {items.map((i) => (
        <div key={i.key} className="range-row" role="listitem">
          <span className="range-label">{i.label}</span>
          <span className="range-track">
            <span
              className={i.tone && i.tone !== 'primary' ? `range-bar range-bar-${i.tone}` : 'range-bar'}
              style={{ left: `${((i.from - from) / span) * 100}%`, width: `${Math.max(((i.to - i.from + 1) / span) * 100, 2)}%` }}
              title={i.description}
            >
              <span aria-hidden={i.description ? true : undefined}>{i.text}</span>
              {i.description && <span className="sr-only">{i.description}</span>}
            </span>
          </span>
        </div>
      ))}
      <div className="range-row range-row-axis" aria-hidden="true">
        <span />
        <span className="range-axis">
          <span>{from}</span>
          <span>{Math.round((from + to) / 2)}</span>
          <span>{to}</span>
        </span>
      </div>
    </div>
  );
}
