import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { Button } from './button.component';
import { UI_MESSAGES } from './ui-text.const';

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
  const ui = useText(UI_MESSAGES);
  return (
    <section className="filter-bar" aria-label={label}>
      {children}
      <div className="filter-bar-meta">
        {/* Always mounted (empty when there is no count): the new count is announced reliably (WCAG 4.1.3). */}
        <span aria-live="polite">{resultCount !== undefined ? ui.results(resultCount) : ''}</span>
        {onReset && activeCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            {ui.clearFilters}
          </Button>
        )}
      </div>
    </section>
  );
}
