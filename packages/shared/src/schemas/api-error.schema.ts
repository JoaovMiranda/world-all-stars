import { z } from 'zod';

/** Error body of the API: `error` code, optional message and field errors (422). */
export const ApiErrorSchema = z.object({
  error: z.string().min(1),
  message: z.string().optional(),
  errors: z.record(z.string(), z.string()).optional(),
});
export type ApiErrorBody = z.infer<typeof ApiErrorSchema>;

/** Empty success body (204-like). */
export const OkResponseSchema = z.object({ ok: z.literal(true) });
export type OkResponse = z.infer<typeof OkResponseSchema>;
