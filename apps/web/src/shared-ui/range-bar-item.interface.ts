import type { ReactNode } from 'react';

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
