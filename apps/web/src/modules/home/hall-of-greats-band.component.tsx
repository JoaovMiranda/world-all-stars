import { HOME_GREATS_LIMIT, type HallOfGreatsEntry, Tier } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { initials } from '@/shared-ui/format.helper';
import { Skeleton } from '@/shared-ui/skeleton.component';
import { TierTag } from '@/shared-ui/tier-tag.component';

import { HOME_TEXT } from './home.const';

const t = HOME_TEXT.greats;

function GreatCard({ athlete }: { athlete: HallOfGreatsEntry }) {
  return (
    <li>
      <Link className={athlete.tier === Tier.Mythic ? 'great-card' : 'great-card great-card-plain'} to="/athletes/$slug" params={{ slug: athlete.slug }}>
        <div className="photo">
          {athlete.photo ? (
            <img src={athlete.photo.url} alt="" referrerPolicy="no-referrer" loading="lazy" />
          ) : (
            <span aria-hidden="true">{initials(athlete.knownAs)}</span>
          )}
        </div>
        <div className="body">
          <TierTag tier={athlete.tier} />
          <h3 className="mt-2">
            <span aria-hidden="true">{athlete.nationalities.map((n) => n.flag).join(' ')} </span>
            {athlete.knownAs}
          </h3>
          <p>
            {athlete.sport.name}
            {athlete.headline ? ` · ${athlete.headline}` : ''}
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Always-dark "stage" band with the Míticos. Empty: message + empty pedestals waiting for the first names. */
export function HallOfGreatsBand({ greats }: { greats: HallOfGreatsEntry[] | undefined }) {
  return (
    <section className="c-12 greats theme-stage" aria-labelledby="greats-title">
      <div className="card-head greats-head">
        <div>
          <span className="label label-gold">{t.kicker}</span>
          <h2 id="greats-title" className="mt-1">
            {t.title}
          </h2>
        </div>
        <ButtonLink to="/hall-of-greats">{t.seeHall}</ButtonLink>
      </div>
      {!greats ? (
        <div className="greats-grid" aria-busy="true">
          {Array.from({ length: HOME_GREATS_LIMIT }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/4.2] w-full rounded-(--r-lg)" />
          ))}
        </div>
      ) : greats.length === 0 ? (
        <div className="greats-empty">
          <EmptyState title={t.emptyTitle} mark="★" action={<ButtonLink to="/about/criteria">{t.emptyAction}</ButtonLink>}>
            <p>{t.emptyText}</p>
          </EmptyState>
          <div className="greats-grid greats-pedestals" aria-hidden="true">
            {Array.from({ length: HOME_GREATS_LIMIT }, (_, i) => (
              <div key={i} className="pedestal">
                <span>◆</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <ul className="greats-grid">
          {greats.slice(0, HOME_GREATS_LIMIT).map((g) => (
            <GreatCard key={g.slug} athlete={g} />
          ))}
        </ul>
      )}
    </section>
  );
}
