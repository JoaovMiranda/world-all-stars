import type { z } from 'zod';

import type { IronmanConfigSchema } from './ironman-config.schema';

export type IronmanConfig = z.infer<typeof IronmanConfigSchema>;
