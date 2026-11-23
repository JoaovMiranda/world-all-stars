import type { z } from 'zod';

import type { CalendarEventSchema, CompetitionEventSchema, ObservanceEventSchema } from '../schemas/calendar-event.schema';

export type CompetitionEvent = z.infer<typeof CompetitionEventSchema>;
export type ObservanceEvent = z.infer<typeof ObservanceEventSchema>;
export type CalendarEvent = z.infer<typeof CalendarEventSchema>;
