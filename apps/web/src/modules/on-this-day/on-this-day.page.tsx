import { addDaysMonthDay, monthDayToIso, nextMonthDayOccurrence } from '@was/shared';
import { getRouteApi, Link } from '@tanstack/react-router';

import { useToday } from '@/app/use-boot.hook';
import { onThisDayQuery } from '@/data/endpoints/discovery.query';
import { useText } from '@/i18n/use-text.hook';
import { Avatar } from '@/shared-ui/avatar.component';
import { ButtonLink } from '@/shared-ui/button-link.component';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { formatDayMonth } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tag } from '@/shared-ui/tag.component';
import { Timeline } from '@/shared-ui/timeline.component';
import { UI_MESSAGES } from '@/shared-ui/ui-text.const';

import { ON_THIS_DAY_GROUPS, ON_THIS_DAY_MESSAGES } from './on-this-day.const';

const route = getRouteApi('/on-this-day/$md');

/** P13 On this day (doc 09): births · achievements · deaths of that month-day (any year), sport day, day ± navigation. */
export function OnThisDayPage() {
  const T = useText(ON_THIS_DAY_MESSAGES);
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const ui = useText(UI_MESSAGES);
  const { md } = route.useParams();
  const label = formatDayMonth(monthDayToIso(md));
  const prev = addDaysMonthDay(md, -1);
  const next = addDaysMonthDay(md, 1);
  const prevLabel = formatDayMonth(monthDayToIso(prev));
  const nextLabel = formatDayMonth(monthDayToIso(next));
  const day = onThisDayQuery.useQuery({ params: { md } });
  const calendarDate = nextMonthDayOccurrence(md, useToday());

  return (
    <PageLayout
      title={T.title(label)}
      eyebrow={T.eyebrow}
      lead={T.lead}
      breadcrumb={[{ label: T.eyebrow }, { label }]}
      contentLocale={day.data?.contentLocale}
      actions={
        <nav className="row" aria-label={T.dayNav}>
          <ButtonLink size="sm" to="/on-this-day/$md" params={{ md: prev }} aria-label={T.prevLabel(prevLabel)}>
            {T.prev(prevLabel)}
          </ButtonLink>
          <ButtonLink size="sm" to="/on-this-day/$md" params={{ md: next }} aria-label={T.nextLabel(nextLabel)}>
            {T.next(nextLabel)}
          </ButtonLink>
        </nav>
      }
    >
      <QueryBoundary query={day} loading={<SkeletonList rows={5} />}>
        {(d) => (
          <>
            {d.observance && (
              <Notice tone="warning">
                <b>
                  {T.observance}: {d.observance.name}
                </b>
                {d.observance.reference && <span className="muted"> ({d.observance.reference})</span>}{' '}
                <Tag tone="soft">{ui.observanceScope[d.observance.scope]}</Tag>{' '}
                {d.observance.sport && (
                  <Link to="/sports/$slug" params={{ slug: d.observance.sport.slug }}>
                    {T.seeSport(d.observance.sport.name)}
                  </Link>
                )}
                {' · '}
                <Link to="/" search={{ date: calendarDate }} hash="calendario">
                  {T.seeCalendar}
                </Link>
              </Notice>
            )}
            {d.items.length === 0 ? (
              <EmptyState title={T.emptyTitle(label)} action={<ButtonLink to="/athletes">{T.emptyAction}</ButtonLink>}>
                {T.emptyText}
              </EmptyState>
            ) : (
              ON_THIS_DAY_GROUPS.map((g) => {
                const items = d.items.filter((i) => g.kinds.includes(i.kind)).sort((a, b) => a.year - b.year);
                if (items.length === 0) return null;
                return (
                  <Section key={g.key} title={T.groups[g.key]} eyebrow={T.count(items.length)}>
                    <Timeline
                      label={T.groups[g.key]}
                      items={items.map((i) => ({
                        key: `${i.athlete.slug}-${i.kind}-${i.year}`,
                        when: <span className="display-num text-lg">{i.year}</span>,
                        tone: g.key === 'achievements' ? 'gold' : 'default',
                        title: (
                          <span className="row gap-2.5">
                            <Avatar name={i.athlete.knownAs} tier={i.athlete.tier} photoUrl={i.athlete.photo?.url ?? null} size={32} />
                            <Link to="/athletes/$slug" params={{ slug: i.athlete.slug }}>
                              {i.athlete.knownAs}
                            </Link>
                            <span className="muted text-sm font-normal">{i.athlete.sport.name}</span>
                          </span>
                        ),
                        detail: `${labels.onThisDayKind[i.kind]} · ${i.title}`,
                      }))}
                    />
                  </Section>
                );
              })
            )}
          </>
        )}
      </QueryBoundary>
    </PageLayout>
  );
}
