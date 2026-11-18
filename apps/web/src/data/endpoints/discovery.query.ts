import { PublicApi, eventsBetween } from '@was/shared';

import { defineQuery } from '../define-endpoint.helper';
import { FIXTURE_CONTENT_LOCALE } from '../data-layer.const';

/** GET /api/hall-of-greats (P11): Mythics + Legendary candidates. */
export const hallOfGreatsQuery = defineQuery(PublicApi.hallOfGreats, {
  sample: async ({ sample }) => ({ ...(await sample('hall-of-greats.json')), contentLocale: FIXTURE_CONTENT_LOCALE }),
});

/** GET /api/sources (P14). */
export const sourcesQuery = defineQuery(PublicApi.sources, { sample: ({ sample }) => sample('sources.json') });

/** GET /api/collection-runs (P14: AI-assisted collection, docs 11/18). */
export const collectionRunsQuery = defineQuery(PublicApi.collectionRuns, { sample: ({ sample }) => sample('collection-runs.json') });

/** GET /api/calendar?from&to&sport (competitions + observances overlapping the range). */
export const calendarQuery = defineQuery(PublicApi.calendar, {
  sample: async ({ input, sample }) => {
    const { from, to, sport } = input.query;
    return eventsBetween(await sample('calendar.json'), from, to).filter((e) => !sport || e.sport?.slug === sport);
  },
});

/** GET /api/today/:md (P13). */
export const onThisDayQuery = defineQuery(PublicApi.onThisDay, {
  sample: async ({ input, sample }) => ({
    ...((await sample('on-this-day.json'))[input.params.md] ?? { md: input.params.md, items: [], observance: null }),
    contentLocale: FIXTURE_CONTENT_LOCALE,
  }),
  empty: ({ input }) => ({ md: input.params.md, items: [], observance: null }),
});

/** GET /api/validation-context: inputs of the shared validators (forms warn with the server's exact rules). */
export const validationContextQuery = defineQuery(PublicApi.validationContext, { sample: ({ sample }) => sample('validation-context.json') });
