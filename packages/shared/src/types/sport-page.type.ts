import type { z } from 'zod';

import type { CollectionReportSchema, SportCompetitionSchema, SportPageSchema } from '../schemas/sport-page.schema';

export type CollectionReport = z.infer<typeof CollectionReportSchema>;
export type SportCompetition = z.infer<typeof SportCompetitionSchema>;
export type SportPage = z.infer<typeof SportPageSchema>;
