import { createHash } from 'node:crypto';

import { getConnInfo } from '@hono/node-server/conninfo';
import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';

import type { AppDeps, HonoEnv } from '../http/app-context.type';

export const clientIp = (c: Parameters<MiddlewareHandler<HonoEnv>>[0]): string => {
  const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
  if (forwarded) return forwarded;
  try {
    return getConnInfo(c).remote.address ?? 'unknown';
  } catch {
    return 'unknown';
  }
};

/** IP is only kept as a salted hash (doc 05). */
export const hashIp = (ip: string, salt: string): string => createHash('sha256').update(`${salt}:${ip}`).digest('hex').slice(0, 32);

/** Resolves the session through the AuthProvider and builds the per-request context (actor for the repository). */
export const sessionMiddleware = (deps: AppDeps): MiddlewareHandler<HonoEnv> => async (c, next) => {
  const resolve = () => deps.auth.resolve({ headers: c.req.raw.headers, header: (n) => c.req.header(n), cookie: (n) => getCookie(c, n), query: (n) => c.req.query(n) });
  // In-process calls of one page render share the first resolution (same cookies, same moment).
  const memo = (c.env as HonoEnv['Bindings'] | undefined)?.ssrSession;
  const session = await (memo ? (memo.session ??= resolve()) : resolve());
  const ipHash = hashIp(clientIp(c), deps.config.ipHashSalt);
  c.set('request', {
    deps,
    session,
    ipHash,
    locale: c.get('locale'),
    actor: { userId: session.user?.id ?? null, name: session.user?.name ?? null, via: 'user', ipHash, userAgent: c.req.header('user-agent') ?? null },
  });
  await next();
};
