import type { HallOfGreatsEntry } from '@was/shared';
import { Link } from '@tanstack/react-router';
import { useRef } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { formatYears, initials } from '@/shared-ui/format.helper';
import { ResponsiveImg } from '@/shared-ui/responsive-img.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';
import { useTilt } from '@/shared-ui/use-tilt.hook';

import { HALL_OF_GREATS_MESSAGES } from './hall-of-greats.const';

/** A Mythic of the Hall: portrait · tier · flags + name · dossier headline · sport, career, evidences, approvals. */
export function LegendCard({ athlete }: { athlete: HallOfGreatsEntry }) {
  const t = useText(HALL_OF_GREATS_MESSAGES).legends;
  const ui = useText(UI_MESSAGES);
  const ref = useRef<HTMLAnchorElement>(null);
  useTilt(ref, 4);
  const meta = [
    athlete.sport.name,
    formatYears(athlete.careerFrom, athlete.careerTo, ui.untilNow),
    t.evidences(athlete.evidences),
    athlete.approvals !== null ? t.approvals(athlete.approvals) : null,
  ].filter(Boolean);
  return (
    <Link ref={ref} className="legend-card tilt tilt-spec tilt-lift" to="/athletes/$slug" params={{ slug: athlete.slug }}>
      <div className="legend-photo">
        {athlete.photo ? (
          // 140px column (96px on phones), cropped to cover ≥190px of height
          <ResponsiveImg url={athlete.photo.url} displayWidth={200} loading="lazy" />
        ) : (
          <span aria-hidden="true">{initials(athlete.knownAs)}</span>
        )}
      </div>
      <div className="legend-body">
        <span>
          <TierTag tier={athlete.tier} />
        </span>
        <h2 className="legend-name">
          <span aria-hidden="true">{athlete.nationalities.map((n) => n.flag).join(' ')} </span>
          {athlete.knownAs}
        </h2>
        {athlete.headline && <p className="legend-headline">{athlete.headline}</p>}
        <small>
          {meta.join(' · ')}
          {/* The flags in the heading are decorative: the countries are read here. */}
          {athlete.nationalities.length > 0 && <span className="sr-only">{` · ${athlete.nationalities.map((n) => n.name).join(', ')}`}</span>}
        </small>
      </div>
    </Link>
  );
}
