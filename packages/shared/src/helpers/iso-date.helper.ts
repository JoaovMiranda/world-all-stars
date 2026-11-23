import type { IsoDate } from '../schemas/iso-date.schema';
import type { MonthDay } from '../schemas/month-day.schema';

const pad2 = (n: number): string => String(n).padStart(2, '0');

/** `YYYY-MM-DD` from calendar parts (month 1–12). */
export const isoDateFromParts = (year: number, month: number, day: number): IsoDate => `${year}-${pad2(month)}-${pad2(day)}`;

/** `MM-DD` from calendar parts (month 1–12). */
export const monthDayFromParts = (month: number, day: number): MonthDay => `${pad2(month)}-${pad2(day)}`;

/** Local calendar day of `date` as `YYYY-MM-DD` (no UTC shift). */
export const toIsoDate = (date: Date): IsoDate => isoDateFromParts(date.getFullYear(), date.getMonth() + 1, date.getDate());

/** Local day of `date` as `MM-DD`. */
export const toMonthDay = (date: Date): MonthDay => monthDayFromParts(date.getMonth() + 1, date.getDate());

/** UTC calendar day of a timestamp as `YYYY-MM-DD`; `null` for a missing date. */
export const isoDate = (date: Date | null | undefined): IsoDate | null => (date ? date.toISOString().slice(0, 10) : null);

/** Full ISO-8601 UTC timestamp (`toISOString`); `null` for a missing date (replaces local `isoOf` copies). */
export const isoDateTime = (date: Date | null | undefined): string | null => (date ? date.toISOString() : null);

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
