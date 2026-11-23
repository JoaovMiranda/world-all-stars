import type { z } from 'zod';

import type { ExtractedFactSchema } from '../schemas/enrichment.schema';

export type ExtractedFact = z.infer<typeof ExtractedFactSchema>;
