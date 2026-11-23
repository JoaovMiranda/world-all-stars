import { API_ERROR_TEXT, ApiErrorCode, type ApiErrorMessageKey, type FieldErrors } from '@was/shared';

import { HttpError } from './http-error.error';

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
