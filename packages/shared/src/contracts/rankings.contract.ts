import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { OkResponseSchema } from '../schemas/api-error.schema';
import { AthleteSlugParamsSchema } from '../schemas/athlete-profile.schema';
import {
  ApproveRankingRequestSchema, AthleteRankingsResponseSchema, CalculateRankingRequestSchema, RankingDetailQuerySchema, RankingDetailResponseSchema,
  RankingMethodologiesResponseSchema, RankingsListResponseSchema,
} from '../schemas/ranking.schema';
import { z } from 'zod';

const IdParams = z.object({ id: z.string().min(1) });

/** Public rankings (published snapshots only) — handoff v3 §8. */
export const RankingsApi = {
  list: defineContract({ access: ApiAccess.Public, method: HttpMethod.Get, path: '/api/rankings', summary: 'Published ranking snapshots', response: RankingsListResponseSchema }),
  detail: defineContract({ access: ApiAccess.Public, method: HttpMethod.Get, path: '/api/rankings/:id', summary: 'Entries of a published snapshot (paginated)', params: IdParams, query: RankingDetailQuerySchema, response: RankingDetailResponseSchema }),
  methodologies: defineContract({ access: ApiAccess.Public, method: HttpMethod.Get, path: '/api/ranking-methodologies', summary: 'Registered methodologies and their rankings', response: RankingMethodologiesResponseSchema }),
  athlete: defineContract({ access: ApiAccess.Public, method: HttpMethod.Get, path: '/api/athletes/:slug/rankings', summary: 'Positions of an athlete in published rankings', params: AthleteSlugParamsSchema, response: AthleteRankingsResponseSchema }),
  adminList: defineContract({ access: ApiAccess.Admin, method: HttpMethod.Get, path: '/api/admin/rankings', summary: 'All snapshots (calculated, published, archived) with approvals', response: RankingsListResponseSchema }),
  calculate: defineContract({ access: ApiAccess.Admin, method: HttpMethod.Post, path: '/api/admin/rankings', summary: 'Calculate candidate snapshots of a methodology', body: CalculateRankingRequestSchema, response: OkResponseSchema }),
  approve: defineContract({ access: ApiAccess.Admin, method: HttpMethod.Post, path: '/api/admin/rankings/:id/approvals', summary: 'Approve a snapshot (2 different admins publish it)', params: IdParams, body: ApproveRankingRequestSchema, response: OkResponseSchema }),
  revert: defineContract({ access: ApiAccess.Admin, method: HttpMethod.Post, path: '/api/admin/rankings/:id/revert', summary: 'Archive the published snapshot and republish the previous one', params: IdParams, body: ApproveRankingRequestSchema, response: OkResponseSchema }),
};
