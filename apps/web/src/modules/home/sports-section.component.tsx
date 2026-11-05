import type { SportCard as SportCardData } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { Skeleton } from '@/shared-ui/skeleton.component';
import { SportCard } from '@/shared-ui/sport-card.component';

import { HOME_TEXT } from './home.const';

const t = HOME_TEXT.sports;

export function SportsSection({ sports }: { sports: SportCardData[] | undefined }) {
  return (
    <section className="c-12" aria-labelledby="sports-title">
      <div className="card-head sports-head">
        <h2 id="sports-title">{t.title}</h2>
        <Link className="label" to="/sports">
          {t.all}
        </Link>
      </div>
      {!sports ? (
        <div className="sport-grid" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-(--r-lg)" />
          ))}
        </div>
      ) : sports.length === 0 ? (
        <EmptyState title={t.emptyTitle} action={<ButtonLink to="/contact">{t.emptyAction}</ButtonLink>}>
          <p>{t.emptyText}</p>
        </EmptyState>
      ) : (
        <ul className="sport-grid">
          {sports.map((s) => (
            <li key={s.slug}>
              <SportCard sport={s} showAssociations={false} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
