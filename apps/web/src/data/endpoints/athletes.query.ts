import { ANALYSIS_DIMENSIONS, CompareQuerySchema, PublicApi, matchesAthleteFilters } from '@was/shared';

import { ApiError } from '../api-error.error';
import { defineQuery } from '../define-endpoint.helper';
import { withDemoTier } from '../fixtures/demo-tier.fixture';

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
    return withDemoTier(profile);
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
    const slugs = CompareQuerySchema.parse(input.query).slugs;
    const [list, dims] = await Promise.all([sample('athletes.json'), sample('analysis-dimensions.json')]);
    const athletes = slugs.flatMap((slug) => {
      const a = list.items.find((x) => x.slug === slug);
      const scores = dims.bySlug[slug];
      return a && scores ? [{ ...withDemoTier(a), scores }] : [];
    });
    return { athletes, max: dims.max };
  },
  empty: () => ({ athletes: [], max: Object.fromEntries(ANALYSIS_DIMENSIONS.map((k) => [k, 0])) }),
});
