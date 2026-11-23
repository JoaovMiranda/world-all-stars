import type { IsoDate } from '../types/iso-date.type';
import type { MonthDay } from '../types/month-day.type';
import { addDaysIso, toIsoDate } from './iso-date.helper';

/** A leap year, so 02-29 exists and the day ring has 366 days. */
const LEAP_YEAR = '2000';

/** `MM-DD` shifted by whole days, wrapping the year (12-31 + 1 → 01-01; 02-28 + 1 → 02-29). */
export const addDaysMonthDay = (md: MonthDay, days: number): MonthDay => addDaysIso(`${LEAP_YEAR}-${md}`, days).slice(5);

/** ISO date of a `MM-DD` in the reference leap year (for formatting "23 de outubro"). */
export const monthDayToIso = (md: MonthDay): IsoDate => `${LEAP_YEAR}-${md}`;

/** Next calendar date (today included) on which `md` happens; 02-29 waits for the next leap year. */
export const nextMonthDayOccurrence = (md: MonthDay, today: IsoDate): IsoDate => {
  const [month = 1, day = 1] = md.split('-').map(Number);
  for (let year = Number(today.slice(0, 4)); ; year++) {
    const candidate = new Date(year, month - 1, day);
    if (candidate.getMonth() !== month - 1) continue;
    const iso = toIsoDate(candidate);
    if (iso >= today) return iso;
  }
};
