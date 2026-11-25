import { RankingsApi } from '@was/shared';

import { defineQuery } from '../define-endpoint.helper';

/** GET /api/athletes/:slug/rankings: positions of the athlete in published rankings (the fixture mode has none yet). */
export const athleteRankingsQuery = defineQuery(RankingsApi.athlete, { sample: () => ({ items: [] }) });
