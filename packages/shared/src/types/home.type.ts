import type { z } from 'zod';

import type { HomeQuerySchema, HomeResponseSchema } from '../schemas/home.schema';

export type HomeQuery = z.infer<typeof HomeQuerySchema>;
export type HomeResponse = z.infer<typeof HomeResponseSchema>;
