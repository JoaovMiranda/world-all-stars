import type { Actor, BaseRepository, Database } from '@was/db';

import type { AuthProvider, AuthUser, SessionContext } from '../auth/auth-provider.type';
import type { ServerConfig } from '../config/env.config';
import type { RateLimiter } from '../middlewares/rate-limit.middleware';
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
}

/** Same as RequestContext, with the signed-in user guaranteed (contracts with access reader/admin). */
export type SignedInContext = RequestContext & { user: AuthUser };

export type HonoEnv = { Variables: { request: RequestContext; requestId: string; /** Pages only: CSP nonce of this response. */ cspNonce: string } };
