import { describe, expect, it } from 'vitest';

import { isoDate, isoDateFromParts, isoDateTime, monthDayFromParts, toIsoDate, toMonthDay } from './iso-date.helper';

describe('ISO date helpers', () => {
  it('formats calendar parts with zero padding', () => {
    expect(isoDateFromParts(1958, 6, 9)).toBe('1958-06-09');
    expect(monthDayFromParts(7, 20)).toBe('07-20');
  });

  it('formats local dates', () => {
    const d = new Date(2026, 0, 5);
    expect(toIsoDate(d)).toBe('2026-01-05');
    expect(toMonthDay(d)).toBe('01-05');
  });

  it('formats timestamps in UTC and keeps null', () => {
    const t = new Date('2026-11-23T01:02:03.000Z');
    expect(isoDate(t)).toBe('2026-11-23');
    expect(isoDateTime(t)).toBe('2026-11-23T01:02:03.000Z');
    expect(isoDate(null)).toBeNull();
    expect(isoDateTime(undefined)).toBeNull();
  });
});
