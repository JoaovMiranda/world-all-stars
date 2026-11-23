import type { Database } from '@was/db';

import type { AuthProvider } from './auth/auth-provider.type';
import type { SessionLookup } from './auth/session-lookup.interface';
import type { ServerConfig } from './config/server-config.type';
import type { WebRuntime } from './web/web-runtime.interface';

export interface CreateAppOptions {
  db: Database;
  config: ServerConfig;
  /** Replaces the whole provider chain (tests). Default: Better Auth + simulated when AUTH_SIMULATED. */
  auth?: AuthProvider;
  /** Replaces Better Auth's session lookup (tests: a stubbed getSession). */
  sessionLookup?: SessionLookup;
  /** Server-rendered pages (apps/web). Absent = API only (tests, missing build). */
  web?: WebRuntime;
  /** Upstream fetch of the image proxy (tests: a stub instead of Wikimedia). */
  imageFetch?: typeof fetch;
}
