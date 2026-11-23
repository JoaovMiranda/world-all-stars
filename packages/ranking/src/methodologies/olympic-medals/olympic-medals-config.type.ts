import type { z } from 'zod';

import type { OlympicMedalsConfigSchema } from './olympic-medals-config.schema';

export type OlympicMedalsConfig = z.infer<typeof OlympicMedalsConfigSchema>;
