import './fact-list.css';

import type { ReactNode } from 'react';

export interface FactItem {
  key: string;
  term: ReactNode;
  detail: ReactNode;
}

interface FactListProps {
  items: readonly FactItem[];
  /** stacked (infobox: term above value) · split (term left, value right). */
  variant?: 'stacked' | 'split';
  label?: string;
}

/** Semantic <dl> of facts (athlete infobox, sport stats). Items with empty detail are skipped by the caller. */
export function FactList({ items, variant = 'stacked', label }: FactListProps) {
  return (
    <dl className={variant === 'split' ? 'fact-list fact-list-split' : 'fact-list'} aria-label={label}>
      {items.map((f) => (
        <div key={f.key}>
          <dt>{f.term}</dt>
          <dd>{f.detail}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Thin rule between FactList groups. */
export function FactListSeparator() {
  return <hr className="fact-list-sep" />;
}
