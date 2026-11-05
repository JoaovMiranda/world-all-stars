import type { FieldErrors } from '@was/shared';
import type { z } from 'zod';

/** Zod issues → `{ 'path.to.field': message }` (first message per path), the 422 shape of the API. */
export const fieldErrorsOf = (error: z.ZodError, prefix?: string): FieldErrors => {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = [prefix, ...issue.path.map(String)].filter(Boolean).join('.') || '_';
    out[key] ??= issue.message;
  }
  return out;
};
