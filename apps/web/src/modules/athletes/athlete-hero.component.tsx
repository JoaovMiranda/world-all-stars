import { Link } from '@tanstack/react-router';
import { type AthleteProfile, AthleteProfileTab, AthleteStatus } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { DateLink } from '@/shared-ui/date-link.component';
import { ageAt, formatYears } from '@/shared-ui/format.helper';
import { Tag } from '@/shared-ui/tag.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { FieldSource } from './field-source.component';

/** Names line under the h1: full name (with source) and nicknames. */
export function AthleteNames({ profile: p }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).hero;
  if (!p.fullName && !p.nicknames.length) return null;
  return (
    <span className="athlete-full-name">
      {p.fullName}
      {p.fullName && <FieldSource profile={p} field="full_name" />}
      {p.fullName && p.nicknames.length > 0 && ' · '}
      {T.nicknames(p.nicknames)}
    </span>
  );
}

/** Nationalities · sport/position · taxonomy, then vitals (dates link to "Today in history"). */
export function AthleteHeroDetails({ profile: p }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).hero;
  const ui = useText(UI_MESSAGES);
  const age = p.birth.date ? ageAt(p.birth.date, p.death?.date ?? null) : null;
  return (
    <>
      <div className="row">
        {p.nationalities.length > 0 && <Tag tone="soft">{p.nationalities.map((n) => `${n.flag} ${n.name}`).join(' · ')}</Tag>}
        <Link className="tag tag-soft" to="/sports/$slug" params={{ slug: p.sport.slug }}>
          {p.sport.name}
          {p.position ? ` · ${p.position}` : ''}
        </Link>
        <Tag tone="soft">
          {p.sport.group} › {p.sport.subgroup}
        </Tag>
      </div>
      <div className="athlete-vitals">
        {p.birth.date && (
          <span>
            <span className="muted">{T.birth}</span>{' '}
            <b>
              <DateLink date={p.birth.date} />
            </b>
            <FieldSource profile={p} field="birth_date" />
          </span>
        )}
        {p.death?.date ? (
          <span>
            <span className="muted">{T.death}</span>{' '}
            <b>
              <DateLink date={p.death.date} />
            </b>
            {age !== null && ` (${T.years(age)})`}
            <FieldSource profile={p} field="death_date" />
          </span>
        ) : (
          age !== null && (
            <span>
              <span className="muted">{T.age}</span> <b>{T.years(age)}</b>
            </span>
          )
        )}
        <span>
          <span className="muted">{T.career}</span> <b>{formatYears(p.careerFrom, p.careerTo, ui.untilNow)}</b>
        </span>
      </div>
    </>
  );
}

/** Tier, Hall of Greats and status badges next to the eyebrow. */
export function AthleteBadges({ profile: p }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).hero;
  return (
    <>
      {p.isHallOfGreats && (
        <Link className="tag tag-gold" to="/hall-of-greats">
          {T.hallOfGreats}
        </Link>
      )}
      {p.status === AthleteStatus.Active && <Tag tone="soft">{T.active}</Tag>}
    </>
  );
}

/** Hero buttons: jump to Analysis, Comments or Sources tabs. */
export function AthleteHeroActions({ version, onGo }: { version: number; onGo: (tab: AthleteProfileTab) => void }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).hero;
  return (
    <>
      <Button variant="secondary" onClick={() => onGo(AthleteProfileTab.Analysis)}>
        {T.analyse}
      </Button>
      <Button variant="secondary" onClick={() => onGo(AthleteProfileTab.Comments)}>
        {T.comment}
      </Button>
      <Button variant="ghost" onClick={() => onGo(AthleteProfileTab.Sources)}>
        {T.version(version)}
      </Button>
    </>
  );
}
