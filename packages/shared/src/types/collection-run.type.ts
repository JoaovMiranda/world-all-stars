import type { z } from 'zod';

import type { CollectionRunSchema } from '../schemas/collection-run.schema';

export type CollectionRun = z.infer<typeof CollectionRunSchema>;
