import type { z } from 'zod';

import type { SourcesFiltersSchema } from '../schemas/sources-filters.schema';

export type SourcesFilters = z.infer<typeof SourcesFiltersSchema>;
