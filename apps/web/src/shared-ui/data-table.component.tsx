import { type ReactNode, useMemo, useRef, useState } from 'react';

import { useText } from '@/i18n/use-text.hook';
import type { DataColumn } from './data-column.interface';
import { UI_MESSAGES } from './ui-text.const';
import { useReveal } from './use-reveal.hook';

interface DataTableProps<T> {
  columns: readonly DataColumn<T>[];
  rows: readonly T[];
  rowKey: (row: T) => string;
  /** Visible caption or sr-only text describing the table. */
  caption: ReactNode;
  captionHidden?: boolean;
  emptyText?: string;
  initialSort?: { key: string; dir: 'asc' | 'desc' };
}

/** Accessible table: sortable headers (buttons + aria-sort), horizontal scroll on small screens, empty row. */
export function DataTable<T>({ columns, rows, rowKey, caption, captionHidden = false, emptyText, initialSort }: DataTableProps<T>) {
  // Rows cascade in the first time the table scrolls into view.
  const bodyRef = useRef<HTMLTableSectionElement>(null);
  useReveal(bodyRef, { stagger: true });
  const ui = useText(UI_MESSAGES);
  const [sort, setSort] = useState(initialSort ?? null);
  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.key === sort.key);
    if (!col?.sortValue || !sort) return rows;
    const get = col.sortValue;
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const x = get(a);
      const y = get(b);
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x < y ? -1 : 1) * dir;
    });
  }, [rows, columns, sort]);

  const toggle = (key: string) => setSort((s) => ({ key, dir: s?.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  return (
    <div className="table-wrap">
      <table className="table">
        <caption className={captionHidden ? 'sr-only' : 'label'}>{caption}</caption>
        <thead>
          <tr>
            {columns.map((c) => {
              const active = sort?.key === c.key;
              return (
                <th
                  key={c.key}
                  scope="col"
                  data-align={c.align}
                  aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : c.sortValue ? 'none' : undefined}
                >
                  {c.sortValue ? (
                    <button type="button" className="sort-btn" onClick={() => toggle(c.key)} aria-label={ui.sortBy(c.header)}>
                      {c.header}
                      <span aria-hidden="true">{active ? (sort.dir === 'asc' ? '▲' : '▼') : '↕'}</span>
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody ref={bodyRef}>
          {sorted.length === 0 ? (
            <tr>
              <td className="table-empty" colSpan={columns.length}>
                {emptyText ?? ui.tableEmpty}
              </td>
            </tr>
          ) : (
            sorted.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key} data-align={c.align}>
                    {c.cell(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
