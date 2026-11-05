import {
  CalendarEventType,
  HOME_UPCOMING_DAYS,
  type HomeResponse,
  type IsoDate,
  type ObservanceEvent,
  addDaysIso,
  eventsBetween,
  monthDayOfIso,
} from '@was/shared';

import type { loadSample } from '../sample-fixtures.helper';

/** Composes GET /api/home for a day from the generated sample files (what the server will do with SQL). */
export const buildSampleHome = async (date: IsoDate, sample: typeof loadSample): Promise<HomeResponse> => {
  const [athletes, onThisDay, calendar, globe, hall, sports] = await Promise.all([
    sample('athletes.json'),
    sample('on-this-day.json'),
    sample('calendar.json'),
    sample('globe.json'),
    sample('hall-of-greats.json'),
    sample('sports.json'),
  ]);
  const md = monthDayOfIso(date);
  const year = Number(date.slice(0, 4));
  const nextObservance =
    calendar.find((e): e is ObservanceEvent => e.type === CalendarEventType.Observance && e.date > date) ?? null;
  return {
    date,
    totalAthletes: athletes.total,
    athleteSlugs: athletes.items.map((a) => a.slug),
    todayInHistory: { ...(onThisDay[md] ?? { md, items: [], observance: null }), nextObservance },
    upcoming: eventsBetween(calendar, date, addDaysIso(date, HOME_UPCOMING_DAYS)),
    calendar: eventsBetween(calendar, `${year - 1}-01-01`, `${year + 1}-12-31`),
    globe,
    greats: hall.greats,
    sports: sports.flatMap((g) => g.subgroups.flatMap((s) => s.sports)),
  };
};
