import type { z } from 'zod';

import type { IsoDateSchema } from '../schemas/iso-date.schema';

export type IsoDate = z.infer<typeof IsoDateSchema>;
