import { RankingsApi } from '@was/shared';

import { ApiError } from '../api-error.error';
import { defineMutation, defineQuery } from '../define-endpoint.helper';

/** GET /api/rankings: published snapshots (the fixture mode has none yet). */
export const rankingsQuery = defineQuery(RankingsApi.list, { sample: () => ({ items: [] }) });

/** GET /api/rankings/:id: entries of a published snapshot. */
export const rankingDetailQuery = defineQuery(RankingsApi.detail, {
  sample: () => {
    throw new ApiError(404, { error: 'not_found' });
  },
  empty: 'not-found',
});

/** GET /api/ranking-methodologies. */
export const rankingMethodologiesQuery = defineQuery(RankingsApi.methodologies, {
  sample: () => ({
    items: [
      { key: 'football-champions', version: '1.0.0', sport: 'football', outputKind: 'score' as const, rankings: [] },
      { key: 'bjj-career', version: '1.0.0', sport: 'jiu-jitsu', outputKind: 'score' as const, rankings: [] },
    ],
  }),
});

/** Admin: every snapshot with approvals; calculate; approve (two different admins publish). */
export const adminRankingsQuery = defineQuery(RankingsApi.adminList, { sample: () => ({ items: [] }) });
export const calculateRanking = defineMutation(RankingsApi.calculate, () => ({ ok: true as const }), { invalidates: [adminRankingsQuery] });
export const approveRanking = defineMutation(RankingsApi.approve, () => ({ ok: true as const }), { invalidates: [adminRankingsQuery, rankingsQuery] });
