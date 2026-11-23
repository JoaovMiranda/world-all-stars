import type { z } from 'zod';

import type { FootballConfigSchema } from './football-config.schema';

export type FootballConfig = z.infer<typeof FootballConfigSchema>;
