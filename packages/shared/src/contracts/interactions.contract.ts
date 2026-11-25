import { ApiAccess } from '../enums/api-access.enum';
import { HttpMethod } from '../enums/http-method.enum';
import { defineContract } from '../helpers/api-contract.helper';
import { AthleteSlugParamsSchema } from '../schemas/athlete-profile.schema';
import { InteractionStateResponseSchema, MyInteractionsResponseSchema, SetHeartRequestSchema } from '../schemas/competitor-interaction.schema';

/**
 * Exclusive star + unlimited hearts (D02/D03). Every mutation is idempotent and answers my state on that competitor plus
 * its public counts; the personal lists are private (reader access, fetched client-side, never in cached HTML).
 */
export const InteractionsApi = {
  myInteractions: defineContract({
    method: HttpMethod.Get,
    access: ApiAccess.Reader,
    path: '/api/me/interactions',
    summary: 'My star and my hearts (private)',
    response: MyInteractionsResponseSchema,
  }),
  setStar: defineContract({
    method: HttpMethod.Put,
    access: ApiAccess.Reader,
    path: '/api/athletes/:slug/star',
    summary: 'Give my only star to this competitor (moves it from the previous one)',
    params: AthleteSlugParamsSchema,
    response: InteractionStateResponseSchema,
  }),
  clearStar: defineContract({
    method: HttpMethod.Delete,
    access: ApiAccess.Reader,
    path: '/api/athletes/:slug/star',
    summary: 'Take my star back from this competitor (no-op when it is elsewhere)',
    params: AthleteSlugParamsSchema,
    response: InteractionStateResponseSchema,
  }),
  toggleHeart: defineContract({
    method: HttpMethod.Put,
    access: ApiAccess.Reader,
    path: '/api/athletes/:slug/heart',
    summary: 'Heart or un-heart this competitor (desired state in the body)',
    params: AthleteSlugParamsSchema,
    body: SetHeartRequestSchema,
    response: InteractionStateResponseSchema,
  }),
} as const;
