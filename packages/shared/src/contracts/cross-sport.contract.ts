import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { AthleteSlugParamsSchema } from '../schemas/athlete-profile.schema';
import {
  AthleteBandResponseSchema,
  AthleteLegacyResponseSchema,
  CrossSportFiltersSchema,
  CrossSportListResponseSchema,
  CrossSportMethodologyResponseSchema,
  CrossSportUnmappedResponseSchema,
} from '../schemas/cross-sport.schema';

/** Cross-sport bands S–D (D07) and legacy levels L1–L5 (D11), computed from published data — handoff §11.4–§11.5. */
export const CrossSportApi = {
  list: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/rankings/all-sports',
    summary: 'Competitors grouped by cross-sport band (approximate comparison)',
    query: CrossSportFiltersSchema,
    response: CrossSportListResponseSchema,
  }),
  methodology: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/rankings/all-sports/methodology',
    summary: 'Cross-sport bands, mappings per sport and run hashes',
    response: CrossSportMethodologyResponseSchema,
  }),
  athleteBand: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/athletes/:slug/band',
    summary: 'Cross-sport band of an athlete with its accepted items',
    params: AthleteSlugParamsSchema,
    response: AthleteBandResponseSchema,
  }),
  athleteLegacy: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/athletes/:slug/legacy',
    summary: 'Legacy level L1–L5 of an athlete (separate from competitive points)',
    params: AthleteSlugParamsSchema,
    response: AthleteLegacyResponseSchema,
  }),
  unmapped: defineContract({
    access: ApiAccess.Admin,
    method: HttpMethod.Get,
    path: '/api/admin/cross-sport/unmapped',
    summary: 'Competitive facts without a cross-sport mapping (review list)',
    response: CrossSportUnmappedResponseSchema,
  }),
};
