import type { z } from 'zod';

import type { SourceRefSchema } from '../schemas/source-ref.schema';

export type SourceRef = z.infer<typeof SourceRefSchema>;
