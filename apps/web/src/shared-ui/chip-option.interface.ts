import type { ReactNode } from 'react';

export interface ChipOption<V extends string> {
  value: V;
  label: ReactNode;
  swatch?: string;
}
