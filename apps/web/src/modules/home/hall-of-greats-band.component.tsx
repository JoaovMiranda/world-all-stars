import { Link } from '@tanstack/react-router';
import { type HallOfGreatsEntry, HOME_GREATS_LIMIT, Tier } from '@was/shared';
import { useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { initials } from '@/shared-ui/format.helper';
import { ResponsiveImg } from '@/shared-ui/responsive-img.component';
import { Reveal } from '@/shared-ui/reveal.component';
import { Skeleton } from '@/shared-ui/skeleton.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { useTilt } from '@/shared-ui/use-tilt.hook';

import { HOME_MESSAGES } from './home.const';

function GreatCard({ athlete }: { athlete: HallOfGreatsEntry }) {
  const ref = useRef<HTMLAnchorElement>(null);
  useTilt(ref, 5);
  return (
    <li>
      <Link
        ref={ref}
        className={athlete.tier === Tier.Mythic ? 'great-card tilt tilt-spec tilt-lift' : 'great-card great-card-plain tilt tilt-spec tilt-lift'}
        to="/athletes/$slug"
        params={{ slug: athlete.slug }}
      >
        <div className="photo">
          {athlete.photo ? (
            // .greats-grid: 4 columns → 2 (≤960px) → 1 (≤520px)
            <ResponsiveImg
              url={athlete.photo.url}
              displayWidth={300}
              fluid={{ sizes: '(max-width: 520px) 100vw, (max-width: 960px) 50vw, 300px', maxWidth: 520 }}
              loading="lazy"
            />
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
            {/* The flags above are decorative: the countries are read here. */}
            {athlete.nationalities.length > 0 && <span className="sr-only">{` · ${athlete.nationalities.map((n) => n.name).join(', ')}`}</span>}
            {athlete.headline ? ` · ${athlete.headline}` : ''}
          </p>
        </div>
      </Link>
    </li>
  );
}

/** Always-dark "stage" band with the Mythic athletes. Empty: message + empty pedestals waiting for the first names. */
export function HallOfGreatsBand({ greats }: { greats: HallOfGreatsEntry[] | undefined }) {
  const t = useText(HOME_MESSAGES).greats;
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
        <Reveal as="ul" className="greats-grid" stagger>
          {greats.slice(0, HOME_GREATS_LIMIT).map((g) => (
            <GreatCard key={g.slug} athlete={g} />
          ))}
        </Reveal>
      )}
    </section>
  );
}
