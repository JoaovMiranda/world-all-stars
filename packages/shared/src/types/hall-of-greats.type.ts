import type { z } from 'zod';

import type { HallOfGreatsEntrySchema, HallOfGreatsResponseSchema } from '../schemas/hall-of-greats.schema';

export type HallOfGreatsEntry = z.infer<typeof HallOfGreatsEntrySchema>;
export type HallOfGreatsResponse = z.infer<typeof HallOfGreatsResponseSchema>;
