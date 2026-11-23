import { HTTP_HEADER, uuidv7 } from '@was/shared';
import type { MiddlewareHandler } from 'hono';

import type { HonoEnv } from '../http/app-context.type';
import type { RequestLogOptions } from './request-log-options.interface';

/**
 * Request id (x-request-id) + one log line per request: method, path, status, duration, session kind. The API calls a
 * page render makes in-process (header x-was-ssr) are flagged `ssr` (text: indented `ssr→api`). Slow requests are
 * `warn` so they can be alerted on; the matching browser-side view is the Server-Timing header (DevTools → Timing).
 */
export const requestLog =
  ({ enabled, format, slowMs }: RequestLogOptions): MiddlewareHandler<HonoEnv> =>
  async (c, next) => {
    const id = c.req.header('x-request-id') ?? uuidv7();
    c.set('requestId', id);
    c.header('x-request-id', id);
    const started = performance.now();
    await next();
    const ms = performance.now() - started;
    const slow = ms >= slowMs;
    if (!enabled && !slow) return;
    const kind = c.get('request')?.session.kind ?? '-';
    const ssr = !!c.req.header(HTTP_HEADER.ssr);
    if (format === 'json') {
      const line = {
        t: new Date().toISOString(),
        level: slow ? 'warn' : 'info',
        msg: 'request',
        id,
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        ms: Math.round(ms * 10) / 10,
        session: kind,
        ...(ssr ? { ssr } : {}),
        ...(slow ? { slow } : {}),
      };
      console.log(JSON.stringify(line));
      return;
    }
    const line = `${c.req.method} ${c.req.path} ${c.res.status} ${ms.toFixed(1)}ms ${kind}${slow ? ' SLOW' : ''}`;
    console.log(ssr ? `[http]   ssr→api ${line}` : `[http] ${line}`);
  };
