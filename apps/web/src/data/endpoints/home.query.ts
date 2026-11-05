import { PublicApi, toMonthDay, fromIsoDate } from '@was/shared';

import { defineQuery } from '../define-endpoint.helper';
import { buildSampleHome } from '../fixtures/home.fixture';

/** GET /api/home?date= (P1). Empty mode: the day exists, the database does not. */
export const homeQuery = defineQuery(PublicApi.home, {
  sample: ({ input, sample }) => buildSampleHome(input.query.date, sample),
  empty: ({ input }) => ({
    date: input.query.date,
    totalAthletes: 0,
    athleteSlugs: [],
    todayInHistory: { md: toMonthDay(fromIsoDate(input.query.date)), items: [], observance: null, nextObservance: null },
    upcoming: [],
    calendar: [],
    globe: [],
    greats: [],
    sports: [],
  }),
});
