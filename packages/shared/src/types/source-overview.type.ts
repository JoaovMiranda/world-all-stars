import type { z } from 'zod';

import type { IngestionRunSchema, SourceOverviewSchema } from '../schemas/source-overview.schema';

export type IngestionRun = z.infer<typeof IngestionRunSchema>;
export type SourceOverview = z.infer<typeof SourceOverviewSchema>;
