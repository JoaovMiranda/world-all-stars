import type { ReactNode } from 'react';

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
