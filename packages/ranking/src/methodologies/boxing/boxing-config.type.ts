import type { z } from 'zod';

import type { BoxingConfigSchema } from './boxing-config.schema';

export type BoxingConfig = z.infer<typeof BoxingConfigSchema>;
