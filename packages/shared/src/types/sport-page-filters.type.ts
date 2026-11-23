import type { z } from 'zod';

import type { SportPageFiltersSchema } from '../schemas/sport-page-filters.schema';

export type SportPageFilters = z.infer<typeof SportPageFiltersSchema>;
