import { type IsoDate, fromIsoDate } from '@was/shared';

import { getBoot } from '@/app/request-scope';
import { currentFormat } from '@/i18n/use-format.hook';

// Thin wrappers over the formatters of the CURRENT language (`createFormatters`, @was/shared). Components prefer
// `useFormat()` (re-renders on a language switch); these read the locale at call time.

/** 23/10/1940 · 10/23/1940 */
export const formatDate = (iso: IsoDate): string => currentFormat().date(iso);
/** 23 de outubro · October 23 */
export const formatDayMonth = (iso: IsoDate): string => currentFormat().dayMonth(iso);
/**
 * Formatter of INSTANTS (ISO datetimes) in the app time zone of the page load, so the server and the browser print
 * the same hour. Plain dates (YYYY-MM-DD) use `formatDate` and need no zone.
 */
export const instantFormat = (options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat => currentFormat().instant(options);
/** 1.279 · 1,279 */
export const formatNumber = (n: number): string => currentFormat().number(n);
/** 11/06/2026 – 19/07/2026 (single date when equal). */
export const formatDateRange = (start: IsoDate, end: IsoDate): string => currentFormat().dateRange(start, end);
/** 1956–1977 or 2003–hoje. */
/** Career span; nothing documented yet → an em dash (never "?–present" for a career we know nothing about). */
export const formatYears = (from: number | null, to: number | null, untilNow: string): string => (from === null && to === null ? '—' : `${from ?? '?'}–${to ?? untilNow}`);
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
