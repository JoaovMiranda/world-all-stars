import type { MergeFieldWinner, MergePreviewField, MergePreviewResponse } from '@was/shared';
import { useId } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { ADMIN_MERGE_MESSAGES } from './admin-merge.const';

interface MergeCompareProps {
  preview: MergePreviewResponse;
  winnerOf: (field: string) => MergeFieldWinner;
  onChoose: (field: string, winner: MergeFieldWinner) => void;
}

/** Side-by-side table: field, A value + source, B value + source; one radio pair per field picks the value that stays. */
export function MergeCompare({ preview, winnerOf, onChoose }: MergeCompareProps) {
  const T = useText(ADMIN_MERGE_MESSAGES);
  const idPrefix = useId();
  const label = (field: string) => T.fields[field] ?? field;
  const cell = (row: MergePreviewField, side: MergeFieldWinner, sideLabel: string) => {
    const { value, source } = row[side];
    return (
      <td>
        <label className="merge-choice">
          <input
            type="radio"
            name={`${idPrefix}-${row.field}`}
            value={side}
            checked={winnerOf(row.field) === side}
            onChange={() => onChoose(row.field, side)}
          />
          <span>
            <span className="sr-only">{T.keep(sideLabel, label(row.field))}: </span>
            {value === null ? <span className="merge-value-empty">{T.emptyValue}</span> : value}
            <small>
              {T.sourceLabel}: {T.sources[source] ?? source}
            </small>
          </span>
        </label>
      </td>
    );
  };
  return (
    <div className="table-wrap">
      <table className="table merge-table">
        <caption className="muted">{T.compareCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{T.fieldColumn}</th>
            <th scope="col">{T.survivorColumn(preview.survivor.name)}</th>
            <th scope="col">{T.mergedColumn(preview.merged.name)}</th>
          </tr>
        </thead>
        <tbody>
          {preview.fields.map((row) => (
            <tr key={row.field}>
              <th scope="row">{label(row.field)}</th>
              {cell(row, 'survivor', 'A')}
              {cell(row, 'merged', 'B')}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
