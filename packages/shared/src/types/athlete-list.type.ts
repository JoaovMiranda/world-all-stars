import type { z } from 'zod';

import type { AthleteListResponseSchema } from '../schemas/athlete-list.schema';

export type AthleteListResponse = z.infer<typeof AthleteListResponseSchema>;
