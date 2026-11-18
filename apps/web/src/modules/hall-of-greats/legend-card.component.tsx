import type { HallOfGreatsEntry } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';
import { formatYears, initials } from '@/shared-ui/format.helper';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';

import { HALL_OF_GREATS_MESSAGES } from './hall-of-greats.const';

/** A Mythic of the Hall: portrait · tier · flags + name · dossier headline · sport, career, evidences, approvals. */
export function LegendCard({ athlete }: { athlete: HallOfGreatsEntry }) {
  const t = useText(HALL_OF_GREATS_MESSAGES).legends;
  const ui = useText(UI_MESSAGES);
  const meta = [
    athlete.sport.name,
    formatYears(athlete.careerFrom, athlete.careerTo, ui.untilNow),
    t.evidences(athlete.evidences),
    athlete.approvals !== null ? t.approvals(athlete.approvals) : null,
  ].filter(Boolean);
  return (
    <Link className="legend-card" to="/athletes/$slug" params={{ slug: athlete.slug }}>
      <div className="legend-photo">
        {athlete.photo ? (
          <img src={athlete.photo.url} alt="" referrerPolicy="no-referrer" loading="lazy" />
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
        <small>{meta.join(' · ')}</small>
      </div>
    </Link>
  );
}
