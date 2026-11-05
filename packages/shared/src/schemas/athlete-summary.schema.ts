import { z } from 'zod';

import { ATHLETE_STATUS_VALUES } from '../enums/athlete-status.enum';
import { TIER_VALUES } from '../enums/tier.enum';
import { CountryRefSchema } from './country-ref.schema';
import { MediaLinkSchema } from './media-link.schema';
import { SportInfoSchema } from './sport-ref.schema';

/** Smallest athlete reference (globe, notifications, admin queues). */
export const AthleteRefSchema = z.object({
  slug: z.string().min(1),
  knownAs: z.string().min(1),
  tier: z.enum(TIER_VALUES),
});
export type AthleteRef = z.infer<typeof AthleteRefSchema>;

/** Athlete as shown in cards and lists (athletes list, Hall of Greats, search, on this day). */
export const AthleteSummarySchema = AthleteRefSchema.extend({
  id: z.string().min(1),
  /** Legacy percentile 0–100 among registered athletes (list order). */
  percentile: z.number().min(0).max(100),
  photo: MediaLinkSchema.nullable(),
  sport: SportInfoSchema,
  nationalities: z.array(CountryRefSchema),
  careerFrom: z.number().int().nullable(),
  careerTo: z.number().int().nullable(),
  status: z.enum(ATHLETE_STATUS_VALUES),
  titles: z.number().int().nonnegative(),
  worldTitles: z.number().int().nonnegative(),
  isHallOfGreats: z.boolean(),
});
export type AthleteSummary = z.infer<typeof AthleteSummarySchema>;
