import { PublicApi, composeHome, homeCalendarWindow, monthDayOfIso } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';

/** P1: one round trip, composed by the same shared function as the web fixtures (composeHome). */
export const homeRoutes = [
  defineRoute(PublicApi.home, async ({ query }, { deps }) => {
    const view = await deps.catalog.get();
    const window = homeCalendarWindow(query.date);
    return composeHome(query.date, {
      athleteSlugs: view.athletes().map((a) => a.slug),
      onThisDay: view.onThisDay(monthDayOfIso(query.date)),
      calendar: view.calendar(window.from, window.to),
      globe: view.globe(),
      greats: view.hallOfGreats(),
      sports: view.sportCards(),
    });
  }),
];
