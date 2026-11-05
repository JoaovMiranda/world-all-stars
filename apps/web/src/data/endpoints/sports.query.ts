import { PublicApi } from '@was/shared';

import { ApiError } from '../api-error.error';
import { defineQuery } from '../define-endpoint.helper';

/** GET /api/sports (P6): group › subgroup › sports with associations. */
export const sportsQuery = defineQuery(PublicApi.sports, { sample: ({ sample }) => sample('sports.json') });

/** GET /api/sports/:slug (P7). */
export const sportPageQuery = defineQuery(PublicApi.sportPage, {
  sample: async ({ input, sample }) => {
    const page = (await sample('sport-pages.json'))[input.params.slug];
    if (!page) throw new ApiError(404, { error: 'not_found' });
    return page;
  },
  empty: 'not-found',
});

/** GET /api/governance-models (doc 18). */
export const governanceModelsQuery = defineQuery(PublicApi.governanceModels, { sample: ({ sample }) => sample('governance-models.json') });

/** GET /api/organizations (doc 19): full hierarchy. */
export const organizationsQuery = defineQuery(PublicApi.organizations, { sample: ({ sample }) => sample('organizations.json') });
