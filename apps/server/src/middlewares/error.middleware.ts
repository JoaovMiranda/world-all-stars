import { EntityNotFoundError, VersionConflictError } from '@was/db';
import { API_ERROR_MESSAGES, ApiErrorCode } from '@was/shared';
import type { ErrorHandler, NotFoundHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { HonoEnv } from '../http/app-context.type';
import { HttpError } from '../http/http-error.error';

/** Every error leaves as the shared ApiErrorSchema body: 422 (+ field errors), 401, 403, 404, 409, 429, 500. */
export const errorHandler: ErrorHandler<HonoEnv> = (error, c) => {
  if (error instanceof HttpError) return c.json(error.body, error.status);
  if (error instanceof EntityNotFoundError) return c.json({ error: ApiErrorCode.NotFound, message: API_ERROR_MESSAGES.notFound }, 404);
  if (error instanceof VersionConflictError) return c.json({ error: 'version_conflict', message: error.message }, 409);
  if (error instanceof HTTPException) return c.json({ error: `http_${error.status}`, message: error.message }, error.status);
  console.error(`[error] ${c.req.method} ${c.req.path}`, error);
  return c.json({ error: ApiErrorCode.Internal, message: API_ERROR_MESSAGES.internal }, 500);
};

export const notFoundHandler: NotFoundHandler<HonoEnv> = (c) => c.json({ error: ApiErrorCode.NotFound, message: API_ERROR_MESSAGES.notFound }, 404);
