import type { z } from 'zod';

import type { ObservanceSchema } from '../schemas/observance.schema';

export type Observance = z.infer<typeof ObservanceSchema>;
