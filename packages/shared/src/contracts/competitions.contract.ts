import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { CompetitionEditionParamsSchema, CompetitionPageSchema, CompetitionParamsSchema, EditionPageSchema } from '../schemas/competition-page.schema';

/** Competition and edition pages (T4.1), read from the universal model (editions, events, entries, results). */
export const CompetitionsApi = {
  competition: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/competitions/:competition',
    summary: 'Competition with its editions, winners and sources',
    params: CompetitionParamsSchema,
    response: CompetitionPageSchema,
  }),
  edition: defineContract({
    access: ApiAccess.Public,
    method: HttpMethod.Get,
    path: '/api/competitions/:competition/editions/:edition',
    summary: 'Edition with events, results, squads, final lineups, medal table and sources',
    params: CompetitionEditionParamsSchema,
    response: EditionPageSchema,
  }),
};
