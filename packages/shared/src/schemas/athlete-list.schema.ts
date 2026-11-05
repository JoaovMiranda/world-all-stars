import { z } from 'zod';

import { AthleteSummarySchema } from './athlete-summary.schema';

/** Response of GET /api/athletes (sorted by legacy percentile, desc). */
export const AthleteListResponseSchema = z.object({
  items: z.array(AthleteSummarySchema),
  total: z.number().int().nonnegative(),
});
export type AthleteListResponse = z.infer<typeof AthleteListResponseSchema>;
