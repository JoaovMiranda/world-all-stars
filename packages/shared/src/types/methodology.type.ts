import type { z } from 'zod';

import type { MethodologyDocResponseSchema } from '../schemas/methodology.schema';

export type MethodologyDocResponse = z.infer<typeof MethodologyDocResponseSchema>;
