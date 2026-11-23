import type { z } from 'zod';

import type { BiographyOutputSchema } from '../schemas/biography.schema';

export type BiographyOutput = z.infer<typeof BiographyOutputSchema>;
