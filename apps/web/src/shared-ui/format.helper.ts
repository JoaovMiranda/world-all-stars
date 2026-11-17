import { type IsoDate, fromIsoDate } from '@was/shared';

import { getBoot } from '@/app/request-scope';

const LOCALE = 'pt-BR';
const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' });
const dayMonthFmt = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long' });
const numberFmt = new Intl.NumberFormat(LOCALE);

/** 23/10/1940 */
export const formatDate = (iso: IsoDate): string => dateFmt.format(fromIsoDate(iso));
/** 23 de outubro */
export const formatDayMonth = (iso: IsoDate): string => dayMonthFmt.format(fromIsoDate(iso));
const instantFormats = new Map<string, Intl.DateTimeFormat>();
/**
 * Formatter of INSTANTS (ISO datetimes) in the app time zone of the page load, so the server and the browser print
 * the same hour. Plain dates (YYYY-MM-DD) use `formatDate` and need no zone.
 */
export const instantFormat = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => {
  const timeZone = getBoot().timeZone;
  const key = `${timeZone}|${JSON.stringify(options)}`;
  let fmt = instantFormats.get(key);
  if (!fmt) instantFormats.set(key, (fmt = new Intl.DateTimeFormat(LOCALE, { ...options, timeZone })));
  return fmt;
};
/** 1.279 */
export const formatNumber = (n: number): string => numberFmt.format(n);
/** 11/06/2026 – 19/07/2026 (single date when equal). */
export const formatDateRange = (start: IsoDate, end: IsoDate): string => (start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`);
/** 1956–1977 or 2003–hoje. */
export const formatYears = (from: number | null, to: number | null, untilNow: string): string => `${from ?? '?'}–${to ?? untilNow}`;
/** Age in full years between two dates (to = today of the page load, APP_TIME_ZONE, by default). */
export const ageAt = (from: IsoDate, to?: IsoDate | null): number => {
  const a = fromIsoDate(from);
  const b = fromIsoDate(to ?? getBoot().today);
  let age = b.getFullYear() - a.getFullYear();
  if (b < new Date(b.getFullYear(), a.getMonth(), a.getDate())) age--;
  return age;
};
/** Up to two initials ("Mike Tyson" → "MT"). */
export const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w.charAt(0))
    .join('')
    .toUpperCase();
export const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
/** CSS value of a sport color token (`c-teal` → `var(--c-teal)`). */
export const tokenColor = (token: string): string => `var(--${token})`;
