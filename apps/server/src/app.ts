import { BaseRepository, type Database } from '@was/db';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { AuthProvider } from './auth/auth-provider.type';
import { createSimulatedAuthProvider, SESSION_HEADER } from './auth/simulated-auth.provider';
import type { ServerConfig } from './config/env.config';
import type { AppDeps, HonoEnv } from './http/app-context.type';
import { registerRoutes } from './http/contract-route.helper';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { createRateLimiter } from './middlewares/rate-limit.middleware';
import { requestLog } from './middlewares/request-log.middleware';
import { apiSecureHeaders } from './middlewares/secure-headers.middleware';
import { sessionMiddleware } from './middlewares/session.middleware';
import { CatalogCache } from './modules/catalog/catalog.cache';
import { ALL_ROUTES } from './routes';
import { mountWeb, type WebRuntime } from './web/web-handler';

export interface CreateAppOptions {
  db: Database;
  config: ServerConfig;
  /** Defaults to the simulated provider (dev); Better Auth later. */
  auth?: AuthProvider;
  /** Server-rendered pages (apps/web). Absent = API only (tests, missing build). */
  web?: WebRuntime;
}

/** Builds the Hono app (no listening): main.ts serves it, tests call `app.request()`. */
export const createApp = ({ db, config, auth, web }: CreateAppOptions) => {
  const catalog = new CatalogCache(db);
  const deps: AppDeps = {
    db,
    repo: new BaseRepository(db, { onWrite: (table) => catalog.onWrite(table) }),
    catalog,
    auth: auth ?? createSimulatedAuthProvider(db),
    config,
    rateLimiter: createRateLimiter(config.rateLimitEnabled),
  };
  const app = new Hono<HonoEnv>();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  app.use('*', requestLog(config.logRequests));
  // CSP: /api never loads anything (default-src 'none'); pages get a per-request nonce policy (web-handler).
  app.use('/api/*', apiSecureHeaders());
  app.use('/api/*', cors({ origin: config.corsOrigins, credentials: true, allowHeaders: ['content-type', SESSION_HEADER], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  app.get('/api/health', (c) => c.json({ ok: true }));
  app.use('/api/*', sessionMiddleware(deps));
  registerRoutes(app, ALL_ROUTES);
  if (web) mountWeb(app, web, config);
  return { app, deps };
};
