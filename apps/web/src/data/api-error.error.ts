import type { ApiErrorBody } from '@was/shared';

/** HTTP-like error thrown by the data layer (real API or fixtures). `body` follows the shared ApiErrorSchema. */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message ?? `${status} ${body.error}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;
export const isNotFound = (error: unknown): boolean => isApiError(error) && error.status === 404;
export const isUnauthorized = (error: unknown): boolean => isApiError(error) && error.status === 401;
