import { CalendarEventType } from '../enums/calendar-event-type.enum';
import type { CalendarEvent } from '../types/calendar-event.type';
import type { IsoDate } from '../types/iso-date.type';

/** First day of an event (start of a competition or the observance date). */
export const eventStart = (e: CalendarEvent): IsoDate => (e.type === CalendarEventType.Competition ? e.start : e.date);

/** Last day of an event. */
export const eventEnd = (e: CalendarEvent): IsoDate => (e.type === CalendarEventType.Competition ? e.end : e.date);

/** Stable key of an event (observances repeat yearly, so slug + date). */
export const eventKey = (e: CalendarEvent): string => (e.type === CalendarEventType.Competition ? e.id : `${e.slug}@${e.date}`);

/** Events happening on a given day. */
export const eventsOnDay = (events: readonly CalendarEvent[], day: IsoDate): CalendarEvent[] =>
  events.filter((e) => eventStart(e) <= day && eventEnd(e) >= day);

/** Events overlapping [from, to], sorted by start (same rule as GET /api/calendar). */
export const eventsBetween = (events: readonly CalendarEvent[], from: IsoDate, to: IsoDate): CalendarEvent[] =>
  events.filter((e) => eventStart(e) <= to && eventEnd(e) >= from).sort((a, b) => eventStart(a).localeCompare(eventStart(b)));
