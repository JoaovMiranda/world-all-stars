import type { IsoDate } from '../types/iso-date.type';
import type { Locale } from '../types/locale.type';

/** Every locale-aware formatter of the app, for one locale and one time zone (APP_TIME_ZONE of the page load). */
export interface Formatters {
  locale: Locale;
  /** 23/10/1940 · 10/23/1940 · 23/10/1940 (plain date, no time zone). */
  date(iso: IsoDate): string;
  /** 23 de outubro · October 23 · 23 de octubre */
  dayMonth(iso: IsoDate): string;
  /** outubro de 2026 · October 2026 (first letter as the locale writes it). */
  monthYear(date: Date): string;
  /** Long month name (outubro · October · octubre). */
  month(date: Date): string;
  /** Short month (out · Oct · oct), no trailing dot. */
  monthShort(date: Date): string;
  /** sábado, 7 de novembro · Saturday, November 7 · sábado, 7 de noviembre */
  weekdayDayMonth(date: Date): string;
  /** 1.279 · 1,279 · 1279 */
  number(n: number): string;
  /** 62% from a 0–1 share. */
  percent(share: number): string;
  /** Single date when both ends are equal. */
  dateRange(start: IsoDate, end: IsoDate): string;
  /** 1956–1977 or 2003–hoje (`untilNow` is a translated word). */
  years(from: number | null, to: number | null, untilNow: string): string;
  /** hoje · ontem · há 3 dias (≤ 30 days), then the date. `now` = instant of the page load. */
  relativeDay(isoDateTime: string, now: Date): string;
  /** Formatter of INSTANTS (ISO datetimes) in the time zone, so the server and the browser print the same hour. */
  instant(options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat;
  /** Plural category (one/other…) for messages that need more than n === 1. */
  plural(n: number): Intl.LDMLPluralRule;
  /** Locale-aware sort of names (accents, case). */
  compare(a: string, b: string): number;
  /** Country name from ISO 3166-1 alpha-2 (fallback when unknown). */
  country(alpha2: string, fallback: string): string;
  /** Name of a language from its tag (pt-BR → Portuguese (Brazil)). */
  language(tag: string): string;
}
