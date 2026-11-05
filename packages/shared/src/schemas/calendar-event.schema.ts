import { z } from 'zod';

import { CalendarEventType } from '../enums/calendar-event-type.enum';
import { COMPETITION_LEVEL_VALUES } from '../enums/competition-level.enum';
import { COMPETITION_STATUS_VALUES } from '../enums/competition-status.enum';
import { CountryRefSchema } from './country-ref.schema';
import { IsoDateSchema } from './iso-date.schema';
import { ObservanceSchema } from './observance.schema';
import { SportInfoSchema } from './sport-ref.schema';

/** A competition edition in the calendar (date range). */
export const CompetitionEventSchema = z.object({
  type: z.literal(CalendarEventType.Competition),
  id: z.string().min(1),
  name: z.string().min(1),
  competition: z.string().min(1),
  start: IsoDateSchema,
  end: IsoDateSchema,
  status: z.enum(COMPETITION_STATUS_VALUES),
  /** Illustrative edition (striped in the calendar). */
  isExample: z.boolean(),
  level: z.enum(COMPETITION_LEVEL_VALUES),
  sport: SportInfoSchema,
  host: CountryRefSchema.nullable(),
});

/** An observance day placed on a concrete date of the requested range. */
export const ObservanceEventSchema = ObservanceSchema.extend({
  type: z.literal(CalendarEventType.Observance),
  date: IsoDateSchema,
});

/** One entry of the calendar (GET /api/calendar): competition or observance. */
export const CalendarEventSchema = z.discriminatedUnion('type', [CompetitionEventSchema, ObservanceEventSchema]);
export type CompetitionEvent = z.infer<typeof CompetitionEventSchema>;
export type ObservanceEvent = z.infer<typeof ObservanceEventSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
