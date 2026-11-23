import type { z } from 'zod';

import type { BoxingStatsSchema, CsStatsSchema, FootballStatsSchema, SwimmingStatsSchema } from '../schemas/sport-stats.schema';

export type FootballStats = z.infer<typeof FootballStatsSchema>;
export type SwimmingStats = z.infer<typeof SwimmingStatsSchema>;
export type BoxingStats = z.infer<typeof BoxingStatsSchema>;
export type CsStats = z.infer<typeof CsStatsSchema>;
