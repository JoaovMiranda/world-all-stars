import type { Actor, BaseRepository, Database } from '@was/db';
import type { Locale } from '@was/shared';

import type { AuthProvider, AuthUser, SessionContext } from '../auth/auth-provider.type';
import type { ServerConfig } from '../config/env.config';
import type { RateLimiter } from '../rate-limit/rate-limiter';
import type { CatalogCache } from '../modules/catalog/catalog.cache';

/** Everything a handler/service needs, built once in createApp (tests build it with an in-memory PGlite). */
export interface AppDeps {
  db: Database;
  /** The only writer (versioning + audit + soft delete). */
  repo: BaseRepository;
  catalog: CatalogCache;
  auth: AuthProvider;
  config: ServerConfig;
  rateLimiter: RateLimiter;
}

/** Per-request context given to every contract handler. */
export interface RequestContext {
  deps: AppDeps;
  session: SessionContext;
  /** Writer identity for the BaseRepository (user id + name, ip hash, user agent). */
  actor: Actor;
  ipHash: string;
  /** Language of the request (localeMiddleware): messages, labels and catalog content. */
  locale: Locale;
}

/** Same as RequestContext, with the signed-in user guaranteed (contracts with access reader/admin). */
export type SignedInContext = RequestContext & { user: AuthUser };

/**
 * One page render: the API calls the renderer makes in-process (`app.fetch(request, { ssrSession })`) carry the same
 * cookies, so the session is resolved once per page instead of once per call.
 */
export interface SsrSessionMemo {
  session?: Promise<SessionContext>;
}

export type HonoEnv = {
  Bindings: { ssrSession?: SsrSessionMemo };
  Variables: {
    request: RequestContext;
    requestId: string;
    /** Pages only: CSP nonce of this response. */
    cspNonce: string;
    /** Request language (API: localeMiddleware; pages: web-handler). */
    locale: Locale;
  };
};
