import { z } from 'zod';

import { ON_THIS_DAY_KIND_VALUES } from '../enums/on-this-day-kind.enum';
import { AthleteSummarySchema } from './athlete-summary.schema';
import { ContentLocaleSchema } from './locale.schema';
import { MonthDaySchema } from './month-day.schema';
import { ObservanceSchema } from './observance.schema';

/** A dated milestone of an athlete (birth, title, record…) shown in "Hoje na história". */
export const OnThisDayItemSchema = z.object({
  year: z.number().int(),
  kind: z.enum(ON_THIS_DAY_KIND_VALUES),
  title: z.string().min(1),
  athlete: AthleteSummarySchema,
});

/** Response of GET /api/today/:md (P13 and the home block). */
export const OnThisDayResponseSchema = z.object({
  md: MonthDaySchema,
  items: z.array(OnThisDayItemSchema),
  observance: ObservanceSchema.nullable(),
  contentLocale: ContentLocaleSchema,
});
export const MonthDayParamsSchema = z.object({ md: MonthDaySchema });
