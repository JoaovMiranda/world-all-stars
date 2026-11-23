import type { z } from 'zod';

import type { AthleteStatsSchema, StatKpiSchema } from '../schemas/athlete-stats.schema';

export type StatKpi = z.infer<typeof StatKpiSchema>;
export type AthleteStats = z.infer<typeof AthleteStatsSchema>;
