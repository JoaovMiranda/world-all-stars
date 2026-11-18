import { ANALYSIS_DIMENSIONS, CompareQuerySchema, PublicApi, composeCompare, matchesAthleteFilters } from '@was/shared';

import { ApiError } from '../api-error.error';
import { defineQuery } from '../define-endpoint.helper';
import { withDemoTier } from '../fixtures/demo-tier.fixture';
import { FIXTURE_CONTENT_LOCALE } from '../data-layer.const';

/** GET /api/athletes (P4): filters q/sport/country/tier/group, sorted by legacy percentile. */
export const athletesQuery = defineQuery(PublicApi.athletes, {
  sample: async ({ input, sample }) => {
    const [list, names] = await Promise.all([sample('athletes.json'), sample('athlete-names.json')]);
    const items = list.items.map(withDemoTier).filter((a) => matchesAthleteFilters(a, input.query, names[a.slug]));
    return { items, total: items.length };
  },
});

/** GET /api/athletes/:slug (P2): every tab of the profile. 404 when the slug does not exist. */
export const athleteProfileQuery = defineQuery(PublicApi.athleteProfile, {
  sample: async ({ input, sample }) => {
    const profile = (await sample('athlete-profiles.json'))[input.params.slug];
    if (!profile) throw new ApiError(404, { error: 'not_found' });
    return { ...withDemoTier(profile), contentLocale: FIXTURE_CONTENT_LOCALE };
  },
  empty: 'not-found',
});

/** GET /api/analysis/dimensions: normalization basis of the Analysis tab (doc 16). */
export const analysisDimensionsQuery = defineQuery(PublicApi.analysisDimensions, {
  sample: ({ sample }) => sample('analysis-dimensions.json'),
});

/** GET /api/compare?slugs=a,b (up to 5 athletes). */
export const compareQuery = defineQuery(PublicApi.compare, {
  sample: async ({ input, sample }) => {
    const [list, dims] = await Promise.all([sample('athletes.json'), sample('analysis-dimensions.json')]);
    return composeCompare(CompareQuerySchema.parse(input.query).slugs, list.items.map(withDemoTier), dims);
  },
  empty: () => ({ athletes: [], max: Object.fromEntries(ANALYSIS_DIMENSIONS.map((k) => [k, 0])) }),
});
