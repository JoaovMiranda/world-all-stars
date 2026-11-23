import { fromIsoDate } from '../helpers/iso-date.helper';
import type { Formatters } from '../interfaces/formatters.interface';
import type { IsoDate } from '../types/iso-date.type';
import type { Locale } from '../types/locale.type';

const DAY_MS = 864e5;
/** Beyond this many days the absolute date reads better than "3 weeks ago". */
const MAX_RELATIVE_DAYS = 30;

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
