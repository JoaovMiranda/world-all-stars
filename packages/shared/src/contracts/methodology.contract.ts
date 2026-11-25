import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { MethodologyDocResponseSchema, MethodologyKeyParamsSchema } from '../schemas/methodology.schema';

/** Public methodology pages (T4.2): each registered methodology's METHODOLOGY.md as sanitized blocks. */
export const MethodologyApi = {
  doc: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/ranking-methodologies/:key',
    summary: 'Methodology document of a registered ranking methodology (sanitized markdown blocks)',
    params: MethodologyKeyParamsSchema,
    response: MethodologyDocResponseSchema,
  }),
};
