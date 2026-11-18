import { PublicApi, addDaysIso, toIsoDate } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { notFound } from '../../http/http-error.error';

/** "Próximos campeonatos" of a sport page: from today to this horizon. */
const SPORT_UPCOMING_DAYS = 425;

/** P6/P7 + governance models and the organization hierarchy (docs 18/19). */
export const sportsRoutes = [
  defineRoute(PublicApi.sports, async (_, { deps, locale }) => (await deps.catalog.get(locale)).sportsTree()),
  defineRoute(PublicApi.sportPage, async ({ params }, { deps, locale }) => {
    const today = toIsoDate(new Date());
    const page = (await deps.catalog.get(locale)).sportPage(params.slug, today, addDaysIso(today, SPORT_UPCOMING_DAYS));
    if (!page) throw notFound();
    return page;
  }),
  defineRoute(PublicApi.governanceModels, async (_, { deps, locale }) => (await deps.catalog.get(locale)).governanceModels()),
  defineRoute(PublicApi.organizations, async (_, { deps, locale }) => (await deps.catalog.get(locale)).orgTree()),
];
