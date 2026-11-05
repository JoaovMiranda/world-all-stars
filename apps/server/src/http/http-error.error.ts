import { API_ERROR_MESSAGES, ApiErrorCode, type ApiErrorBody, type FieldErrors } from '@was/shared';

/** Error with the HTTP status and the shared error body (ApiErrorSchema). Thrown by services, rendered by onError. */
export class HttpError extends Error {
  constructor(
    readonly status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500,
    readonly body: ApiErrorBody,
  ) {
    super(body.message ?? body.error);
    this.name = 'HttpError';
  }
}

export const notFound = (message: string = API_ERROR_MESSAGES.notFound) => new HttpError(404, { error: ApiErrorCode.NotFound, message });
export const forbidden = (error: string = ApiErrorCode.Forbidden, message: string = API_ERROR_MESSAGES.forbidden) => new HttpError(403, { error, message });
/** 422 with optional field errors (`{ errors: { 'urls.0': '…' } }`), the shape the web forms map onto fields. */
export const unprocessable = (error: string, message: string, errors?: FieldErrors) =>
  new HttpError(422, { error, message, ...(errors && Object.keys(errors).length ? { errors } : {}) });
/** 422 of a form: field errors from a shared validator. */
export const invalidFields = (errors: FieldErrors, message: string = API_ERROR_MESSAGES.checkFields) => unprocessable(ApiErrorCode.Validation, message, errors);
