import { z } from 'zod';

import { AthleteSummarySchema } from './athlete-summary.schema';
import { ContentLocaleSchema } from './locale.schema';

/** A Mythic in the Hall of Greats: summary + dossier headline and counters. */
export const HallOfGreatsEntrySchema = AthleteSummarySchema.extend({
  headline: z.string().nullable(),
  evidences: z.number().int().nonnegative(),
  approvals: z.number().int().nonnegative().nullable(),
});

/** Response of GET /api/hall-of-greats: the Mythics + Legendary candidates without a dossier. */
export const HallOfGreatsResponseSchema = z.object({
  greats: z.array(HallOfGreatsEntrySchema),
  candidates: z.array(AthleteSummarySchema),
  contentLocale: ContentLocaleSchema,
});
