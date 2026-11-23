import type { z } from 'zod';

import type { ApiErrorSchema, OkResponseSchema } from '../schemas/api-error.schema';

export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;
export type OkResponse = z.infer<typeof OkResponseSchema>;
