import { z } from 'zod';

import { AthleteRefSchema } from './athlete-summary.schema';
import { SportRefSchema } from './sport-ref.schema';

/** Titles of registered athletes aggregated by primary nationality (choropleth of the desk globe). */
export const GlobeCountrySchema = z.object({
  /** ISO 3166-1 numeric, 3 digits; matches `id` in world-atlas (Natural Earth). */
  isoNumeric: z.string().regex(/^\d{3}$/),
  iso2: z.string().length(2),
  name: z.string().min(1),
  flag: z.string().min(1),
  totalTitles: z.number().int().nonnegative(),
  sports: z.array(z.object({ sport: SportRefSchema, titles: z.number().int().nonnegative() })),
  athletes: z.array(AthleteRefSchema),
});
