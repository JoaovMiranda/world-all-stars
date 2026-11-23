import type { z } from 'zod';

import type { MonthDaySchema } from '../schemas/month-day.schema';

export type MonthDay = z.infer<typeof MonthDaySchema>;
