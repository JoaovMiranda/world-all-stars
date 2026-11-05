import { HOME_UPCOMING_DAYS } from '../consts/home.const';
import { CalendarEventType } from '../enums/calendar-event-type.enum';
import type { CalendarEvent, ObservanceEvent } from '../schemas/calendar-event.schema';
import type { GlobeCountry } from '../schemas/globe-country.schema';
import type { HallOfGreatsEntry } from '../schemas/hall-of-greats.schema';
import type { HomeResponse } from '../schemas/home.schema';
import type { IsoDate } from '../schemas/iso-date.schema';
import type { OnThisDayResponse } from '../schemas/on-this-day.schema';
import type { SportCard } from '../schemas/sports-tree.schema';
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
