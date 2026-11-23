import { z } from 'zod';

import { CalendarEventSchema } from './calendar-event.schema';
import { IsoDateSchema } from './iso-date.schema';

/** Query of GET /api/calendar: events overlapping [from, to]. */
export const CalendarQuerySchema = z.object({
  from: IsoDateSchema,
  to: IsoDateSchema,
  sport: z.string().optional(),
});
export const CalendarResponseSchema = z.array(CalendarEventSchema);
