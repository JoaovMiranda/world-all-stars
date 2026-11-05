import { z } from 'zod';

import { OBSERVANCE_RECOGNITION_VALUES } from '../enums/observance-recognition.enum';
import { OBSERVANCE_SCOPE_VALUES } from '../enums/observance-scope.enum';
import { CountryRefSchema } from './country-ref.schema';
import { MonthDaySchema } from './month-day.schema';
import { SportInfoSchema } from './sport-ref.schema';

/** A sport observance day (world/national day of a sport), recurring every year on `md`. */
export const ObservanceSchema = z.object({
  slug: z.string().min(1),
  md: MonthDaySchema,
  name: z.string().min(1),
  scope: z.enum(OBSERVANCE_SCOPE_VALUES),
  recognition: z.enum(OBSERVANCE_RECOGNITION_VALUES),
  reference: z.string().nullable(),
  country: CountryRefSchema.nullable(),
  sport: SportInfoSchema.nullable(),
});
export type Observance = z.infer<typeof ObservanceSchema>;
