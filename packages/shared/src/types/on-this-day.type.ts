import type { z } from 'zod';

import type { OnThisDayItemSchema, OnThisDayResponseSchema } from '../schemas/on-this-day.schema';

export type OnThisDayItem = z.infer<typeof OnThisDayItemSchema>;
export type OnThisDayResponse = z.infer<typeof OnThisDayResponseSchema>;
