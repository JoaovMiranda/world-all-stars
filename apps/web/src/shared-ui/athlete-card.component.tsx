import type { AthleteSummary } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { Avatar } from './avatar.component';
import { formatYears } from './format.helper';
import { Tag } from './tag.component';
import { TierTag } from './tier-tag.component';
import { UI_TEXT } from './ui-text.const';

/** Clickable athlete card (lists, sport page, search): avatar with tier ring, flags, sport, career, titles. */
export function AthleteCard({ athlete }: { athlete: AthleteSummary }) {
  return (
    <Link className="athlete-card" to="/athletes/$slug" params={{ slug: athlete.slug }}>
      <Avatar name={athlete.knownAs} tier={athlete.tier} photoUrl={athlete.photo?.url ?? null} size={52} />
      <span className="athlete-card-body">
        <b>{athlete.knownAs}</b>
        <small>
          <span aria-hidden="true">{athlete.nationalities.map((n) => n.flag).join(' ')} </span>
          <span className="sr-only">{athlete.nationalities.map((n) => n.name).join(', ')} · </span>
          {athlete.sport.name} · {formatYears(athlete.careerFrom, athlete.careerTo, UI_TEXT.untilNow)}
        </small>
        <span className="row mt-1.5">
          <TierTag tier={athlete.tier} />
          <Tag tone="soft">{UI_TEXT.titles(athlete.titles, athlete.worldTitles)}</Tag>
        </span>
      </span>
    </Link>
  );
}
