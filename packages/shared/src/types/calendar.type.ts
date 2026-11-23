import type { z } from 'zod';

import type { CalendarQuerySchema } from '../schemas/calendar.schema';

export type CalendarQuery = z.infer<typeof CalendarQuerySchema>;
