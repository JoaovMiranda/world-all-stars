import { CrossSportApi, CrossSportFiltersSchema } from '@was/shared';

import { defineQuery } from '../define-endpoint.helper';
import {
  buildAthleteBand,
  buildAthleteLegacy,
  buildCrossSportList,
  buildCrossSportMethodology,
  buildCrossSportUnmapped,
} from '../fixtures/cross-sport.fixture';

/** GET /api/rankings/all-sports: competitors grouped by cross-sport band S→D (D07). */
export const crossSportListQuery = defineQuery(CrossSportApi.list, {
  sample: ({ sample, input }) => buildCrossSportList(sample, CrossSportFiltersSchema.parse(input?.query ?? {})),
});

/** GET /api/rankings/all-sports/methodology: bands, mapping rows per sport and run hashes. */
export const crossSportMethodologyQuery = defineQuery(CrossSportApi.methodology, { sample: ({ sample }) => buildCrossSportMethodology(sample) });

/** GET /api/athletes/:slug/band: the athlete's band and accepted items (profile readout). */
export const athleteBandQuery = defineQuery(CrossSportApi.athleteBand, {
  sample: ({ sample, input }) => buildAthleteBand(sample, input.params.slug),
  empty: 'not-found',
});

/** GET /api/athletes/:slug/legacy: legacy level L1–L5, separate from competitive points (D11). */
export const athleteLegacyQuery = defineQuery(CrossSportApi.athleteLegacy, {
  sample: ({ sample, input }) => buildAthleteLegacy(sample, input.params.slug),
  empty: 'not-found',
});

/** Admin: competitive facts without a mapping (review list). */
export const crossSportUnmappedQuery = defineQuery(CrossSportApi.unmapped, { sample: ({ sample }) => buildCrossSportUnmapped(sample) });
