import type { ApiErrorBody, ApiErrorMessageKey } from '@was/shared';

/**
 * Error with the HTTP status and the shared error body (ApiErrorSchema). Thrown by services, rendered by onError.
 * `messageKey` (API_ERROR_MESSAGES) lets the error handler send `message` in the request locale; the pt-BR text in
 * `body.message` is only the fallback (logs, tests).
 */
export class HttpError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 413 | 422 | 429 | 500,
    readonly body: ApiErrorBody,
    readonly messageKey?: ApiErrorMessageKey,
  ) {
    super(body.message ?? body.error);
    this.name = 'HttpError';
  }
}
