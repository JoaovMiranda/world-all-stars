import type { AthleteSummary } from '@was/shared';
import type { ReactNode } from 'react';

import { AthleteCard } from './athlete-card.component';
import { EmptyState } from './empty-state.component';

interface AthleteGridProps {
  athletes: readonly AthleteSummary[];
  /** Shown when the list is empty (e.g. no match for the filters). */
  emptyTitle: string;
  emptyText?: ReactNode;
  emptyAction?: ReactNode;
}

/** Responsive grid of AthleteCards with its own empty state. */
export function AthleteGrid({ athletes, emptyTitle, emptyText, emptyAction }: AthleteGridProps) {
  if (athletes.length === 0) {
    return (
      <EmptyState title={emptyTitle} action={emptyAction}>
        {emptyText}
      </EmptyState>
    );
  }
  return (
    <ul className="athlete-grid">
      {athletes.map((a) => (
        <li key={a.slug}>
          <AthleteCard athlete={a} />
        </li>
      ))}
    </ul>
  );
}
