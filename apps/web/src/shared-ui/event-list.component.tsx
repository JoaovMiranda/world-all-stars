import { type CalendarEvent, eventKey } from '@was/shared';
import type { ReactNode } from 'react';

import { EmptyState } from './empty-state.component';
import { EventRow } from './event-row.component';

interface EventListProps {
  events: readonly CalendarEvent[];
  emptyTitle: string;
  emptyText?: ReactNode;
  withBadges?: boolean;
}

/** List of EventRows (home "Next 30 days", calendar day, sport page "Upcoming championships"). */
export function EventList({ events, emptyTitle, emptyText, withBadges = false }: EventListProps) {
  if (events.length === 0) {
    return (
      <EmptyState title={emptyTitle} mark="◇" compact>
        {emptyText}
      </EmptyState>
    );
  }
  return (
    <ul className="event-list">
      {events.map((e) => (
        <EventRow key={eventKey(e)} event={e} withBadges={withBadges} />
      ))}
    </ul>
  );
}
