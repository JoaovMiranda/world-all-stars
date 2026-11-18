import type { ReactNode } from 'react';

import { currentText } from '@/i18n/text-for.helper';
import { DataTable } from '@/shared-ui/data-table.component';
import { formatNumber, tokenColor } from '@/shared-ui/format.helper';

import { bestFlags, type CellValue, seriesToken } from './analysis.helper';
import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';

export interface MatrixRow {
  key: string;
  label: ReactNode;
  values: readonly CellValue[];
  /** true = higher wins, false = lower wins, null = not ranked. */
  higher?: boolean | null;
  render?: (value: CellValue, index: number) => ReactNode;
}

const show = (v: CellValue): ReactNode =>
  v === null ? <span className="muted">{currentText(ATHLETE_PROFILE_MESSAGES).noData}</span> : typeof v === 'number' ? formatNumber(v) : v;

interface CompareMatrixProps {
  caption: string;
  /** Header of the first column. */
  rowHeader: string;
  athletes: readonly { slug: string; knownAs: string }[];
  rows: readonly MatrixRow[];
}

/** One row per metric, one column per athlete; the best value of each row is bold with a gold diamond. */
export function CompareMatrix({ caption, rowHeader, athletes, rows }: CompareMatrixProps) {
  return (
    <DataTable<MatrixRow>
      caption={caption}
      captionHidden
      rows={rows}
      rowKey={(r) => r.key}
      columns={[
        { key: '_label', header: rowHeader, cell: (r) => r.label },
        ...athletes.map((a, i) => ({
          key: a.slug,
          header: a.knownAs,
          align: 'end' as const,
          cell: (r: MatrixRow) => {
            const v = r.values[i] ?? null;
            const best = bestFlags(r.values, r.higher === undefined ? true : r.higher)[i];
            const content = r.render ? r.render(v, i) : show(v);
            return best ? <span className="is-best">{content}</span> : content;
          } })),
      ]}
    />
  );
}

/** Small colored square used in legends and headers. */
export function SeriesSwatch({ index }: { index: number }) {
  return <span className="swatch" style={{ background: tokenColor(seriesToken(index).slice(2)) }} aria-hidden="true" />;
}
