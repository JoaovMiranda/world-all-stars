import { CompareApi, composeHeadToHead, type HeadToHeadInput, HeadToHeadQuerySchema } from '@was/shared';

import { ApiError } from '../api-error.error';
import { FIXTURE_CONTENT_LOCALE } from '../data-layer.const';
import { defineQuery } from '../define-endpoint.helper';
import { buildAthleteBand, buildAthleteLegacy } from '../fixtures/cross-sport.fixture';
import { withDemoTier } from '../fixtures/demo-tier.fixture';
import type { loadSample } from '../sample-fixtures.helper';

/** Fixture side: sample profile + the fixture band/legacy readouts; the fixture mode has no published rankings. */
const fixtureSide = async (sample: typeof loadSample, slug: string): Promise<HeadToHeadInput> => {
  const profile = (await sample('athlete-profiles.json'))[slug];
  if (!profile) throw new ApiError(404, { error: 'not_found' });
  const [band, legacy] = await Promise.all([buildAthleteBand(sample, slug), buildAthleteLegacy(sample, slug)]);
  return { profile: { ...withDemoTier(profile), contentLocale: FIXTURE_CONTENT_LOCALE }, band, legacy, rankings: [] };
};

/** GET /api/compare/head-to-head?a=&b=: two competitors side by side (D04). */
export const headToHeadQuery = defineQuery(CompareApi.compare, {
  sample: async ({ input, sample }) => {
    const { a, b } = HeadToHeadQuerySchema.parse(input.query);
    const [left, right] = await Promise.all([fixtureSide(sample, a), fixtureSide(sample, b)]);
    return composeHeadToHead(left, right, new Map());
  },
  empty: 'not-found',
});
