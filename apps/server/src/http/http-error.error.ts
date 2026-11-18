import { API_ERROR_TEXT, ApiErrorCode, type ApiErrorBody, type ApiErrorMessageKey, type FieldErrors } from '@was/shared';

/**
 * Error with the HTTP status and the shared error body (ApiErrorSchema). Thrown by services, rendered by onError.
 * `messageKey` (API_ERROR_MESSAGES) lets the error handler send `message` in the request locale; the pt-BR text in
 * `body.message` is only the fallback (logs, tests).
 */
export class HttpError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
    readonly body: ApiErrorBody,
    readonly messageKey?: ApiErrorMessageKey,
  ) {
    super(body.message ?? body.error);
    this.name = 'HttpError';
  }
}

/** HttpError whose message is one of the shared API messages (translated by the error handler). */
export const httpError = (status: HttpError['status'], error: string, key: ApiErrorMessageKey, errors?: FieldErrors) =>
  new HttpError(status, { error, message: API_ERROR_TEXT[key], ...(errors && Object.keys(errors).length ? { errors } : {}) }, key);

export const notFound = () => httpError(404, ApiErrorCode.NotFound, 'notFound');
export const forbidden = (error: string = ApiErrorCode.Forbidden, key: ApiErrorMessageKey = 'forbidden') => httpError(403, error, key);
/** 422 with a message already in the request locale (shared validators/rules called with `ctx.locale`). */
export const unprocessable = (error: string, message: string, errors?: FieldErrors) =>
  new HttpError(422, { error, message, ...(errors && Object.keys(errors).length ? { errors } : {}) });
/** 422 with one of the shared API messages. */
export const unprocessableKey = (error: string, key: ApiErrorMessageKey, errors?: FieldErrors) => httpError(422, error, key, errors);
/** 422 of a form: field errors from a shared validator (already localized), summary message from the API messages. */
export const invalidFields = (errors: FieldErrors, key: ApiErrorMessageKey = 'checkFields') => httpError(422, ApiErrorCode.Validation, key, errors);
