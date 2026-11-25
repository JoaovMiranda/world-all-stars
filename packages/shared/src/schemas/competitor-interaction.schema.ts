import { z } from 'zod';

import { AthleteRefSchema } from './athlete-summary.schema';

const count = z.number().int().nonnegative();

/** Public aggregate of a competitor (D03): how many accounts starred / hearted it. Never who. */
export const InteractionCountsSchema = z.object({ stars: count, hearts: count });

/** Body of PUT /api/athletes/:slug/heart: the desired state (idempotent: the same body twice changes nothing). */
export const SetHeartRequestSchema = z.object({ hearted: z.boolean() });

/** Response of every star/heart mutation: my state on that competitor and its new public counts. */
export const InteractionStateResponseSchema = z.object({
  starred: z.boolean(),
  hearted: z.boolean(),
  counts: InteractionCountsSchema,
});

/** One competitor in my private list, with when I starred/hearted it. */
export const MyInteractionItemSchema = z.object({ athlete: AthleteRefSchema, at: z.iso.datetime() });

/** Response of GET /api/me/interactions: my star and my hearts (private to the owner, never cached in public HTML). */
export const MyInteractionsResponseSchema = z.object({
  star: MyInteractionItemSchema.nullable(),
  hearts: z.array(MyInteractionItemSchema),
});
