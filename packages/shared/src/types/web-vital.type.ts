import type { z } from 'zod';

import type { WEB_VITAL_NAMES, WebVitalSchema, WebVitalsRequestSchema } from '../schemas/web-vital.schema';

export type WebVitalName = (typeof WEB_VITAL_NAMES)[number];
export type WebVital = z.infer<typeof WebVitalSchema>;
export type WebVitalsRequest = z.infer<typeof WebVitalsRequestSchema>;
