import type { CalendarEvent } from '@was/shared';

import { useText } from '@/i18n/use-text.hook';
import { EventList } from '@/shared-ui/event-list.component';
import { Section } from '@/shared-ui/section.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';

import { HOME_MESSAGES } from './home.const';

export function UpcomingList({ events }: { events: CalendarEvent[] | undefined }) {
  const t = useText(HOME_MESSAGES).upcoming;
  return (
    <Section title={t.title} span={4} busy={!events}>
      {!events ? <SkeletonList className="h-14 w-full" /> : <EventList events={events} emptyTitle={t.emptyTitle} emptyText={<p>{t.emptyText}</p>} />}
    </Section>
  );
}
