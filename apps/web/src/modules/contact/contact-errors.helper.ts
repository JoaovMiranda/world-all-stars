import type { FieldErrors } from '@was/shared';

import { isApiError } from '@/data/api-error.error';

/** Field errors of a 422 response (shared validators on the server), or undefined for any other failure. */
export const fieldErrorsOf = (error: unknown): FieldErrors | undefined =>
  isApiError(error) && error.status === 422 && error.body.errors ? error.body.errors : undefined;
