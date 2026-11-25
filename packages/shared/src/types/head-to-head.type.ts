import type { z } from 'zod';

import type { HeadToHeadQuerySchema, HeadToHeadResponseSchema, HeadToHeadSearchSchema, HeadToHeadSideSchema } from '../schemas/head-to-head.schema';

export type HeadToHeadQuery = z.output<typeof HeadToHeadQuerySchema>;
export type HeadToHeadSearch = z.output<typeof HeadToHeadSearchSchema>;
export type HeadToHeadSide = z.infer<typeof HeadToHeadSideSchema>;
export type HeadToHeadResponse = z.infer<typeof HeadToHeadResponseSchema>;
