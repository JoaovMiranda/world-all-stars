import type { z } from 'zod';

import type { AdminQueueSearchSchema } from '../schemas/admin-search.schema';

export type AdminQueueSearch = z.infer<typeof AdminQueueSearchSchema>;
