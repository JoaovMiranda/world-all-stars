import type { z } from 'zod';

import type { BjjConfigSchema } from './bjj-config.schema';

export type BjjConfig = z.infer<typeof BjjConfigSchema>;
