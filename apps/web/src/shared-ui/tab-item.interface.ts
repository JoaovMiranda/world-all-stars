import type { ReactNode } from 'react';

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
  /** Small counter after the label (e.g. comments). */
  count?: number;
}
