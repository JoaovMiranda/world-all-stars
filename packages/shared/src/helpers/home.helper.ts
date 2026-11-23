import { HOME_UPCOMING_DAYS } from '../consts/home.const';
import { CalendarEventType } from '../enums/calendar-event-type.enum';
import type { CalendarEvent, ObservanceEvent } from '../types/calendar-event.type';
import type { GlobeCountry } from '../types/globe-country.type';
import type { HallOfGreatsEntry } from '../types/hall-of-greats.type';
import type { HomeResponse } from '../types/home.type';
import type { IsoDate } from '../types/iso-date.type';
import type { OnThisDayResponse } from '../types/on-this-day.type';
import type { SportCard } from '../types/sports-tree.type';
import { eventsBetween } from './calendar-event.helper';
import { addDaysIso, monthDayOfIso } from './iso-date.helper';

export interface HomeParts {
  athleteSlugs: readonly string[];
  /** "Hoje na história" of the day (null = no fact on that day). */
  onThisDay: OnThisDayResponse | null;
  /** Calendar covering at least [year − 1, year + 1] of the date. */
  calendar: readonly CalendarEvent[];
  globe: GlobeCountry[];
  greats: HallOfGreatsEntry[];
  sports: SportCard[];
}

/** Calendar window the home needs for a day (current year ± 1). */
export const homeCalendarWindow = (date: IsoDate): { from: IsoDate; to: IsoDate } => {
  const year = Number(date.slice(0, 4));
  return { from: `${year - 1}-01-01`, to: `${year + 1}-12-31` };
};

/** Composes GET /api/home for a day from its parts (same composition on the server and in the web fixtures). */
export const composeHome = (date: IsoDate, parts: HomeParts): HomeResponse => {
  const md = monthDayOfIso(date);
  const window = homeCalendarWindow(date);
  const nextObservance = parts.calendar.find((e): e is ObservanceEvent => e.type === CalendarEventType.Observance && e.date > date) ?? null;
  return {
    date,
    totalAthletes: parts.athleteSlugs.length,
    athleteSlugs: [...parts.athleteSlugs],
    todayInHistory: { ...(parts.onThisDay ?? { md, items: [], observance: null }), nextObservance },
    upcoming: eventsBetween(parts.calendar, date, addDaysIso(date, HOME_UPCOMING_DAYS)),
    calendar: eventsBetween(parts.calendar, window.from, window.to),
    globe: parts.globe,
    greats: parts.greats,
    sports: parts.sports,
  };
};
