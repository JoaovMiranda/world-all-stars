import { describe, expect, it } from 'vitest';

import type { CalendarEvent } from '../schemas/calendar-event.schema';
import { eventKey, eventsBetween, eventsOnDay } from './calendar-event.helper';

const cup = { type: 'competition', id: 'c1', start: '2026-06-11', end: '2026-07-19' } as CalendarEvent;
const day = { type: 'observance', slug: 'dia', date: '2026-05-25' } as CalendarEvent;

describe('calendar event helpers', () => {
  it('finds events by day and range', () => {
    expect(eventsOnDay([cup, day], '2026-07-01')).toEqual([cup]);
    expect(eventsOnDay([cup, day], '2026-05-25')).toEqual([day]);
    expect(eventsBetween([cup, day], '2026-05-01', '2026-06-11')).toEqual([day, cup]);
    expect(eventsBetween([cup, day], '2026-08-01', '2026-12-31')).toEqual([]);
  });
  it('keys observances by slug and date', () => expect(eventKey(day)).toBe('dia@2026-05-25'));
});
