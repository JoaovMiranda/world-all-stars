import type { BaseRepository, Database } from '@was/db';

import type { AuthProvider } from '../auth/auth-provider.type';
import type { ServerConfig } from '../config/server-config.type';
import type { CatalogCache } from '../modules/catalog/catalog.cache';
import type { RateLimiter } from '../rate-limit/rate-limiter.interface';

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
