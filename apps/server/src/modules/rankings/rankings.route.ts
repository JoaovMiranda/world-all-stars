import { RankingsApi } from '@was/shared';

import { defineRoute } from '../../http/contract-route.helper';
import { approveSnapshot, athleteRankings, calculateRankings, listAll, listPublished, methodologiesList, rankingDetail } from './rankings.service';

/** Rankings (handoff v3 §8): public = published snapshots only; admin = calculate + two approvals to publish. */
export const rankingsRoutes = [
  defineRoute(RankingsApi.list, (_input, { deps }) => listPublished(deps.db)),
  defineRoute(RankingsApi.detail, ({ params, query }, { deps }) => rankingDetail(deps.db, params.id, query.page, query.pageSize)),
  defineRoute(RankingsApi.methodologies, () => methodologiesList()),
  defineRoute(RankingsApi.athlete, ({ params }, { deps }) => athleteRankings(deps.db, params.slug)),
  defineRoute(RankingsApi.adminList, (_input, { deps }) => listAll(deps.db)),
  defineRoute(RankingsApi.calculate, async ({ body }, { deps, actor }) => {
    await calculateRankings(deps, body.methodology, actor);
    return { ok: true as const };
  }),
  defineRoute(RankingsApi.approve, async ({ params, body }, { deps, actor }) => {
    await approveSnapshot(deps, params.id, actor, body.reason);
    return { ok: true as const };
  }),
];
