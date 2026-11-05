import { uuidv7 } from '@was/shared';
import type { MiddlewareHandler } from 'hono';

import type { HonoEnv } from '../http/app-context.type';

/** Request id (x-request-id) + one log line per request: method, path, status, duration, session kind. */
export const requestLog = (enabled: boolean): MiddlewareHandler<HonoEnv> => async (c, next) => {
  const id = c.req.header('x-request-id') ?? uuidv7();
  c.set('requestId', id);
  c.header('x-request-id', id);
  const started = performance.now();
  await next();
  if (!enabled) return;
  const kind = c.get('request')?.session.kind ?? '-';
  console.log(`[http] ${c.req.method} ${c.req.path} ${c.res.status} ${(performance.now() - started).toFixed(1)}ms ${kind}`);
};
