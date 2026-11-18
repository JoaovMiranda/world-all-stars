import { fromIsoDate } from '../helpers/iso-date.helper';
import type { IsoDate } from '../schemas/iso-date.schema';
import type { Locale } from './locale.const';

const DAY_MS = 864e5;
/** Beyond this many days the absolute date reads better than "3 weeks ago". */
const MAX_RELATIVE_DAYS = 30;

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

const cache = new Map<string, Formatters>();

const build = (locale: Locale, timeZone: string | undefined): Formatters => {
  const dateFmt = new Intl.DateTimeFormat(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dayMonthFmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'long' });
  const monthYearFmt = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' });
  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });
  const monthShortFmt = new Intl.DateTimeFormat(locale, { month: 'short' });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const numberFmt = new Intl.NumberFormat(locale);
  const percentFmt = new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 });
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const plural = new Intl.PluralRules(locale);
  const collator = new Intl.Collator(locale, { sensitivity: 'base', numeric: true });
  const regions = new Intl.DisplayNames([locale], { type: 'region' });
  const languages = new Intl.DisplayNames([locale], { type: 'language' });
  const instants = new Map<string, Intl.DateTimeFormat>();
  const date = (iso: IsoDate) => dateFmt.format(fromIsoDate(iso));
  return {
    locale,
    date,
    dayMonth: (iso) => dayMonthFmt.format(fromIsoDate(iso)),
    monthYear: (d) => monthYearFmt.format(d),
    month: (d) => monthFmt.format(d),
    monthShort: (d) => monthShortFmt.format(d).replace(/\.$/, ''),
    weekdayDayMonth: (d) => weekdayFmt.format(d),
    number: (n) => numberFmt.format(n),
    percent: (share) => percentFmt.format(share),
    dateRange: (start, end) => (start === end ? date(start) : `${date(start)} – ${date(end)}`),
    years: (from, to, untilNow) => `${from ?? '?'}–${to ?? untilNow}`,
    relativeDay: (isoDateTime, now) => {
      const days = Math.floor((now.getTime() - new Date(isoDateTime).getTime()) / DAY_MS);
      return days < MAX_RELATIVE_DAYS ? rtf.format(-Math.max(days, 0), 'day') : date(isoDateTime.slice(0, 10));
    },
    instant: (options) => {
      const key = JSON.stringify(options);
      let fmt = instants.get(key);
      if (!fmt) instants.set(key, (fmt = new Intl.DateTimeFormat(locale, { ...options, ...(timeZone ? { timeZone } : {}) })));
      return fmt;
    },
    plural: (n) => plural.select(n),
    compare: (a, b) => collator.compare(a, b),
    country: (alpha2, fallback) => {
      try {
        return regions.of(alpha2.toUpperCase()) ?? fallback;
      } catch {
        return fallback;
      }
    },
    language: (tag) => {
      try {
        return languages.of(tag) ?? tag;
      } catch {
        return tag;
      }
    },
  };
};

/** Formatters of a locale (+ time zone for instants), memoized: cheap to call on every render. */
export const createFormatters = (locale: Locale, timeZone?: string): Formatters => {
  const key = `${locale}|${timeZone ?? ''}`;
  let hit = cache.get(key);
  if (!hit) cache.set(key, (hit = build(locale, timeZone)));
  return hit;
};
