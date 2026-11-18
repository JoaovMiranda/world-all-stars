import type { AthleteProfile } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { useText } from '@/i18n/use-text.hook';
import { DateLink } from '@/shared-ui/date-link.component';
import { type FactItem, FactList, FactListSeparator } from '@/shared-ui/fact-list.component';
import { ageAt, formatYears } from '@/shared-ui/format.helper';
import { Section } from '@/shared-ui/section.component';
import { TierTag } from '@/shared-ui/tier-tag.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';

import { formatPlace } from './athlete-profile.helper';
import { ATHLETE_PROFILE_MESSAGES, INFOBOX_TEAMS_MAX } from './athletes.const';
import { FieldSource } from './field-source.component';

function External({ href, children }: { href: string; children: string }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).infobox;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
      <span className="sr-only"> {T.external}</span>
    </a>
  );
}

/** Sticky "Ficha": identity, life events, teams, tier and external links, each field with its source ⓘ. */
export function AthleteInfobox({ profile: p }: { profile: AthleteProfile }) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).infobox;
  const D = useText(ATHLETE_PROFILE_MESSAGES).dash;
  const profileText = useText(ATHLETE_PROFILE_MESSAGES);
  const ui = useText(UI_MESSAGES);
  const deathAge = p.birth.date && p.death?.date ? ageAt(p.birth.date, p.death.date) : null;
  const personal: FactItem[] = [
    { key: 'name', term: T.fullName, detail: <>{p.fullName ?? D}<FieldSource profile={p} field="full_name" /></> },
    ...(p.nicknames.length ? [{ key: 'nick', term: T.nicknames, detail: p.nicknames.join(', ') }] : []),
    {
      key: 'birth',
      term: T.birth,
      detail: (
        <>
          {p.birth.date ? <DateLink date={p.birth.date} /> : D}
          <FieldSource profile={p} field="birth_date" />
          <span className="cell-sub">{formatPlace(p.birth.city)}</span>
        </>
      ),
    },
    ...(p.death
      ? [
          {
            key: 'death',
            term: T.death,
            detail: (
              <>
                {p.death.date ? <DateLink date={p.death.date} /> : D}
                {deathAge !== null && ` (${profileText.hero.years(deathAge)})`}
                <FieldSource profile={p} field="death_date" />
                <span className="cell-sub">{formatPlace(p.death.city)}</span>
              </>
            ),
          },
        ]
      : []),
    { key: 'nat', term: T.nationality, detail: p.nationalities.map((n) => `${n.flag} ${n.name}`).join(', ') || D },
    {
      key: 'height',
      term: T.height,
      detail: p.heightCm ? (
        <>
          {T.heightValue(p.heightCm)}
          <FieldSource profile={p} field="height_cm" />
        </>
      ) : (
        <span className="muted">{profileText.noData}</span>
      ),
    },
    { key: 'pos', term: T.position, detail: p.position ?? D },
    {
      key: 'sport',
      term: T.sport,
      detail: (
        <>
          <Link to="/sports/$slug" params={{ slug: p.sport.slug }}>
            {p.sport.name}
          </Link>
          {p.category && <span className="muted"> · {p.category}</span>}
        </>
      ),
    },
  ];
  const teams = p.teams.slice(-INFOBOX_TEAMS_MAX);
  const meta: FactItem[] = [
    { key: 'tier', term: T.tier, detail: <span className="row"><TierTag tier={p.tier} /><span className="muted">{T.percentile(p.percentile)}</span></span> },
    ...(p.wikidataQid ? [{ key: 'qid', term: T.wikidata, detail: <External href={`https://www.wikidata.org/wiki/${p.wikidataQid}`}>{p.wikidataQid}</External> }] : []),
    ...(p.sourceLinks.length
      ? [
          {
            key: 'links',
            term: T.links,
            detail: (
              <span className="row">
                {p.sourceLinks.map((s, i) => (
                  <External key={`${s.slug}-${i}`} href={s.url}>
                    {s.name}
                  </External>
                ))}
              </span>
            ),
          },
        ]
      : []),
  ];

  return (
    <Section title={p.knownAs} eyebrow={T.eyebrow} headingLevel={2}>
      <FactList items={personal} />
      {teams.length > 0 && (
        <>
          <FactListSeparator />
          <FactList
            label={T.teamsLabel}
            variant="split"
            items={teams.map((t, i) => ({
              key: `${t.name}-${i}`,
              term: <span className="num">{formatYears(t.from, t.to, ui.untilNow)}</span>,
              detail: `${t.country?.flag ?? ''} ${t.name}`.trim(),
            }))}
          />
          {p.teams.length > INFOBOX_TEAMS_MAX && <p className="vote-foot">{T.moreTeams(p.teams.length - INFOBOX_TEAMS_MAX)}</p>}
        </>
      )}
      <FactListSeparator />
      <FactList items={meta} />
    </Section>
  );
}
