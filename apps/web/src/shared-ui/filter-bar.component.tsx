import type { ReactNode } from 'react';

import { Button } from './button.component';
import { UI_TEXT } from './ui-text.const';

interface FilterBarProps {
  /** Accessible name of the filter region. */
  label: string;
  /** Filter fields (FormField + Select/SearchInput, ChipToggleGroup…). */
  children: ReactNode;
  /** Number of results (announced politely). */
  resultCount?: number;
  /** Shows "Limpar filtros" when > 0. */
  activeCount?: number;
  onReset?: () => void;
}

/** Row of filters bound to the URL (pair with useUrlFilters(schema)). */
export function FilterBar({ label, children, resultCount, activeCount = 0, onReset }: FilterBarProps) {
  return (
    <section className="filter-bar" aria-label={label}>
      {children}
      <div className="filter-bar-meta">
        {resultCount !== undefined && <span aria-live="polite">{UI_TEXT.results(resultCount)}</span>}
        {onReset && activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {UI_TEXT.clearFilters}
          </Button>
        )}
      </div>
    </section>
  );
}
