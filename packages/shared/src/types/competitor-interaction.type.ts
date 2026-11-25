import type { z } from 'zod';

import type {
  InteractionCountsSchema,
  InteractionStateResponseSchema,
  MyInteractionItemSchema,
  MyInteractionsResponseSchema,
  SetHeartRequestSchema,
} from '../schemas/competitor-interaction.schema';

export type InteractionCounts = z.infer<typeof InteractionCountsSchema>;
export type SetHeartRequest = z.infer<typeof SetHeartRequestSchema>;
export type InteractionStateResponse = z.infer<typeof InteractionStateResponseSchema>;
export type MyInteractionItem = z.infer<typeof MyInteractionItemSchema>;
export type MyInteractionsResponse = z.infer<typeof MyInteractionsResponseSchema>;
