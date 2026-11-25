import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { HeadToHeadQuerySchema, HeadToHeadResponseSchema } from '../schemas/head-to-head.schema';

/**
 * Compare / head-to-head (D04), page `/compare?a=&b=`. The path sits under `/api/compare/` because
 * `GET /api/compare?slugs=` already serves the Analysis tab of the profile (up to 5 athletes).
 */
export const CompareApi = {
  compare: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/compare/head-to-head',
    summary: 'Two competitors side by side: sports, band, legacy, titles, same-sport methodology positions, sources',
    query: HeadToHeadQuerySchema,
    response: HeadToHeadResponseSchema,
  }),
};
