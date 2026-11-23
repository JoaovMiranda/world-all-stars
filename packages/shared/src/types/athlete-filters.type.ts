import type { z } from 'zod';

import type { AthleteFiltersSchema, AthleteListQuerySchema } from '../schemas/athlete-filters.schema';

export type AthleteFilters = z.infer<typeof AthleteFiltersSchema>;
export type AthleteListQuery = z.infer<typeof AthleteListQuerySchema>;
