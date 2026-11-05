import type { IsoDate } from '../schemas/iso-date.schema';
import type { MonthDay } from '../schemas/month-day.schema';

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** Local calendar day of `date` as `YYYY-MM-DD` (no UTC shift). */
export const toIsoDate = (date: Date): IsoDate =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** Local day of `date` as `MM-DD`. */
export const toMonthDay = (date: Date): MonthDay => `${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/** Parses `YYYY-MM-DD` as a local date (midnight). */
export const fromIsoDate = (iso: IsoDate): Date => {
  const [y = 1970, m = 1, d = 1] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Adds whole days to an ISO date (local calendar, DST-safe). */
export const addDaysIso = (iso: IsoDate, days: number): IsoDate => {
  const d = fromIsoDate(iso);
  d.setDate(d.getDate() + days);
  return toIsoDate(d);
};

/** `MM-DD` part of an ISO date. */
export const monthDayOfIso = (iso: IsoDate): MonthDay => iso.slice(5, 10);
