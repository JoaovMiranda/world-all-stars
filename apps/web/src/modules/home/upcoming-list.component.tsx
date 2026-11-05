import type { CalendarEvent } from '@was/shared';

import { EventList } from '@/shared-ui/event-list.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { HOME_TEXT } from './home.const';

const t = HOME_TEXT.upcoming;

export function UpcomingList({ events }: { events: CalendarEvent[] | undefined }) {
  return (
    <Section title={t.title} span={4} busy={!events}>
      {!events ? <SkeletonList className="h-14 w-full" /> : <EventList events={events} emptyTitle={t.emptyTitle} emptyText={<p>{t.emptyText}</p>} />}
    </Section>
  );
}
