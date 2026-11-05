import { type AthleteProfile, OnThisDayKind } from '@was/shared';

import { DateLink } from '@/shared-ui/date-link.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatDate, formatYears } from '@/shared-ui/format.helper';
import { RangeBars } from '@/shared-ui/range-bars.component';
import { Section } from '@/shared-ui/section.component';
import { SourceInfo } from '@/shared-ui/source-info.component';
import { Timeline, type TimelineItem } from '@/shared-ui/timeline.component';
import { UI_TEXT } from '@/shared-ui/ui-text.const';

import { currentYear } from './athlete-profile.helper';
import { ATHLETE_PROFILE_TEXT } from './athletes.const';

const T = ATHLETE_PROFILE_TEXT.career;
const NATIONAL_TEAM = 'national';
const yearOf = (iso: string) => Number(iso.slice(0, 4));
const TONE: Partial<Record<OnThisDayKind, TimelineItem['tone']>> = { [OnThisDayKind.Title]: 'gold', [OnThisDayKind.Record]: 'gold', [OnThisDayKind.Death]: 'muted' };

/** Carreira: teams gantt (national team in green), title reigns, milestones timeline with day links. */
export function CareerTab({ profile: p }: { profile: AthleteProfile }) {
  const now = currentYear();
  const teams = p.teams.filter((t) => t.from !== null);
  return (
    <div className="stack">
      <Section title={T.teamsTitle} eyebrow={formatYears(p.careerFrom, p.careerTo, UI_TEXT.untilNow)}>
        {teams.length ? (
          <RangeBars
            label={T.teamsLabel}
            items={teams.map((t, i) => {
              const from = t.from ?? now;
              const to = t.to ?? now;
              return {
                key: `${t.name}-${i}`,
                label: `${t.country?.flag ?? ''} ${t.name}`.trim(),
                from,
                to,
                text: formatYears(t.from, t.to, UI_TEXT.untilNow),
                description: T.teamDescription(t.name, t.fromDate ? formatDate(t.fromDate) : String(from), t.toDate ? formatDate(t.toDate) : t.to ? String(t.to) : UI_TEXT.untilNow, t.role),
                tone: t.kind === NATIONAL_TEAM ? 'success' : 'primary',
              };
            })}
          />
        ) : (
          <EmptyState compact title={T.noTeams} mark="◇" />
        )}
      </Section>
      {p.reigns.length > 0 && (
        <Section title={T.reignsTitle}>
          <RangeBars
            label={T.reignsLabel}
            items={p.reigns.map((r, i) => ({
              key: `${r.competition}-${r.won}-${i}`,
              label: r.competition,
              from: yearOf(r.won),
              to: yearOf(r.lost ?? r.won),
              text: `${formatDate(r.won)}${r.lost ? ` – ${formatDate(r.lost)}` : ''}`,
              description: T.reignDescription(r.competition, formatDate(r.won), r.lost ? formatDate(r.lost) : T.unknownEnd, r.endReason),
              tone: 'accent',
            }))}
          />
        </Section>
      )}
      <Section title={T.milestonesTitle} eyebrow={T.milestonesHint}>
        {p.milestones.length ? (
          <Timeline
            label={T.milestonesTitle}
            items={p.milestones.map((m, i) => ({
              key: `${m.date}-${i}`,
              when: <DateLink date={m.date} />,
              title: (
                <>
                  {m.title}
                  <SourceInfo source={m.source} field={m.title} />
                </>
              ),
              tone: TONE[m.kind] ?? 'default',
            }))}
          />
        ) : (
          <EmptyState compact title={T.noMilestones} mark="◇" />
        )}
      </Section>
    </div>
  );
}
