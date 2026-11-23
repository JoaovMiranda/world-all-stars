import type { BaseRepository, Database } from '@was/db';
import type { Locale } from '@was/shared';

import type { AuthProvider, AuthUser, SessionContext } from '../auth/auth-provider.type';
import type { ServerConfig } from '../config/env.config';
import type { RequestContext } from '../core/request-context.interface';
import type { CatalogCache } from '../modules/catalog/catalog.cache';
import type { RateLimiter } from '../rate-limit/rate-limiter';

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

export type { RequestContext } from '../core/request-context.interface';

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
