import type { z } from 'zod';

import type { AthleteRefSchema, AthleteSummarySchema } from '../schemas/athlete-summary.schema';

export type AthleteRef = z.infer<typeof AthleteRefSchema>;
export type AthleteSummary = z.infer<typeof AthleteSummarySchema>;
