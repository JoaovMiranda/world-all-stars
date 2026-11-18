import { HTTP_HEADER, uuidv7 } from '@was/shared';
import type { MiddlewareHandler } from 'hono';

import type { HonoEnv } from '../http/app-context.type';

/**
 * Request id (x-request-id) + one log line per request: method, path, status, duration, session kind. The API calls a
 * page render makes in-process (header x-was-ssr) are logged indented as `ssr→api`, just before the page line.
 */
export const requestLog = (enabled: boolean): MiddlewareHandler<HonoEnv> => async (c, next) => {
  const id = c.req.header('x-request-id') ?? uuidv7();
  c.set('requestId', id);
  c.header('x-request-id', id);
  const started = performance.now();
  await next();
  if (!enabled) return;
  const kind = c.get('request')?.session.kind ?? '-';
  const line = `${c.req.method} ${c.req.path} ${c.res.status} ${(performance.now() - started).toFixed(1)}ms ${kind}`;
  console.log(c.req.header(HTTP_HEADER.ssr) ? `[http]   ssr→api ${line}` : `[http] ${line}`);
};
