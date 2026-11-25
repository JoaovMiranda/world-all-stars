import { Link } from '@tanstack/react-router';
import type { AthleteProfile } from '@was/shared';
import { useMemo } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { FactList } from '@/shared-ui/fact-list.component';
import { LevelTag } from '@/shared-ui/level-tag.component';
import { Section } from '@/shared-ui/section.component';

import { byYear, groupTitlesByCompetition } from './achievements.helper';
import { PROFILE_TITLES_MESSAGES } from './profile-titles.const';
import { YearChips } from './year-chips.component';

/**
 * T4.3 "Titles": titles and medals grouped by competition (world level first) and by result type, with the years and
 * a link to each competition page. Nothing is rendered for an athlete without titles or medals.
 */
export function ProfileTitles({ profile }: { profile: AthleteProfile }) {
  const t = useText(PROFILE_TITLES_MESSAGES);
  const groups = useMemo(() => groupTitlesByCompetition(profile.achievements), [profile.achievements]);
  if (!groups.length) return null;
  const total = groups.reduce((n, g) => n + g.items.length, 0);
  return (
    <Section title={t.title} eyebrow={t.count(total)}>
      <ul className="grid gap-4">
        {groups.map((g) => (
          <li key={g.key} className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="m-0">
                <Link to="/competitions/$competition" params={{ competition: g.key }}>
                  {g.name}
                </Link>
              </h3>
              <LevelTag level={g.level} />
            </div>
            <FactList
              variant="split"
              label={t.kindsLabel(g.name)}
              items={g.kinds.map((k) => ({
                key: k.type,
                term: t.kindCount(t.kinds[k.type] ?? k.type, k.items.length),
                detail: (
                  <YearChips
                    chips={byYear(k.items).map(([year, items]) => {
                      const details = [...new Set(items.map((i) => [i.edition.label, i.category, i.team].filter(Boolean).join(' · ')).filter(Boolean))].join(
                        '; ',
                      );
                      return {
                        key: String(year),
                        text: `${year}${items.length > 1 ? ` ${t.times(items.length)}` : ''}`,
                        ...(details ? { title: details } : {}),
                      };
                    })}
                  />
                ),
              }))}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
