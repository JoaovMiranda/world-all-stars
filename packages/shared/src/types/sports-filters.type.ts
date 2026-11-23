import type { z } from 'zod';

import type { SportsFiltersSchema } from '../schemas/sports-filters.schema';

export type SportsFilters = z.infer<typeof SportsFiltersSchema>;
