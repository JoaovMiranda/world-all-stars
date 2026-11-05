import { type HomeResponse, type IsoDate, composeHome, monthDayOfIso } from '@was/shared';

import type { loadSample } from '../sample-fixtures.helper';

/** GET /api/home from the generated sample files, composed by the SAME shared function as the server (composeHome). */
export const buildSampleHome = async (date: IsoDate, sample: typeof loadSample): Promise<HomeResponse> => {
  const [athletes, onThisDay, calendar, globe, hall, sports] = await Promise.all([
    sample('athletes.json'),
    sample('on-this-day.json'),
    sample('calendar.json'),
    sample('globe.json'),
    sample('hall-of-greats.json'),
    sample('sports.json'),
  ]);
  return composeHome(date, {
    athleteSlugs: athletes.items.map((a) => a.slug),
    onThisDay: onThisDay[monthDayOfIso(date)] ?? null,
    calendar,
    globe,
    greats: hall.greats,
    sports: sports.flatMap((g) => g.subgroups.flatMap((s) => s.sports)),
  });
};
