import { CompetitionsApi } from '@was/shared';

import { defineQuery } from '../define-endpoint.helper';
import { buildCompetitionPage, buildEditionPage } from '../fixtures/competitions.fixture';

/** GET /api/competitions/:competition (T4.1): the competition, its editions and winners. */
export const competitionPageQuery = defineQuery(CompetitionsApi.competition, {
  sample: ({ sample, input }) => buildCompetitionPage(sample, input.params.competition),
  empty: 'not-found',
});

/** GET /api/competitions/:competition/editions/:edition (T4.1): events, results, squads, lineups, medal table. */
export const editionPageQuery = defineQuery(CompetitionsApi.edition, {
  sample: ({ sample, input }) => buildEditionPage(sample, input.params.competition, input.params.edition),
  empty: 'not-found',
});
