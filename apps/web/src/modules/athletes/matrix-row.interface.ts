import type { ReactNode } from 'react';
import type { CellValue } from './cell-value.type';

export interface MatrixRow {
  key: string;
  label: ReactNode;
  values: readonly CellValue[];
  /** true = higher wins, false = lower wins, null = not ranked. */
  higher?: boolean | null;
  render?: (value: CellValue, index: number) => ReactNode;
}
