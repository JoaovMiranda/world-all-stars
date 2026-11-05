import type { GovernanceModelInfo } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { EmptyState } from '@/shared-ui/empty-state.component';

import { SPORTS_TEXT } from './sports.const';

const t = SPORTS_TEXT.models;

/** Cards of the 5 governance models (doc 18) with links to their sports. */
export function GovernanceModels({ models }: { models: readonly GovernanceModelInfo[] }) {
  if (models.length === 0) {
    return (
      <EmptyState title={t.emptyTitle} compact>
        {t.emptyText}
      </EmptyState>
    );
  }
  return (
    <ul className="gov-models">
      {models.map((m) => (
        <li key={m.slug} className="gov-model">
          <h3>{m.name}</h3>
          <p className="muted">{m.summary}</p>
          {m.sports.length > 0 ? (
            <ul className="row mt-2 gap-1">
              {m.sports.map((s) => (
                <li key={s.slug}>
                  <Link className="tag tag-soft" to="/sports/$slug" params={{ slug: s.slug }}>
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted mt-2">{t.none}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
