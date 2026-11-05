import { z } from 'zod';

/** Day of the year without year, `MM-DD` (aspect `calendar_days`). */
export const MonthDaySchema = z.string().regex(/^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/, 'Expected MM-DD');
export type MonthDay = z.infer<typeof MonthDaySchema>;
