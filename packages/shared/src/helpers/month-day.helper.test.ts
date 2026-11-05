import { describe, expect, it } from 'vitest';

import { addDaysMonthDay, monthDayToIso, nextMonthDayOccurrence } from './month-day.helper';

describe('month-day helpers', () => {
  it('moves across months and the year end', () => {
    expect(addDaysMonthDay('10-23', 1)).toBe('10-24');
    expect(addDaysMonthDay('10-31', 1)).toBe('11-01');
    expect(addDaysMonthDay('12-31', 1)).toBe('01-01');
    expect(addDaysMonthDay('01-01', -1)).toBe('12-31');
  });
  it('keeps 29 February reachable', () => {
    expect(addDaysMonthDay('02-28', 1)).toBe('02-29');
    expect(addDaysMonthDay('03-01', -1)).toBe('02-29');
    expect(monthDayToIso('02-29')).toBe('2000-02-29');
  });
  it('finds the next occurrence of a day', () => {
    expect(nextMonthDayOccurrence('11-04', '2026-11-04')).toBe('2026-11-04');
    expect(nextMonthDayOccurrence('10-23', '2026-11-04')).toBe('2027-10-23');
    expect(nextMonthDayOccurrence('02-29', '2026-11-04')).toBe('2028-02-29');
  });
});
