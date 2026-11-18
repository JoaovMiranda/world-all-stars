import { BaseRepository, type Database } from '@was/db';
import { LOCALE_HEADER } from '@was/shared';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

import type { AuthProvider } from './auth/auth-provider.type';
import { AUTH_BASE_PATH, createBetterAuth } from './auth/better-auth.config';
import { createBetterAuthProvider, type SessionLookup } from './auth/better-auth.provider';
import { createCompositeAuthProvider } from './auth/composite.provider';
import { createSimulatedAuthProvider, SESSION_HEADER } from './auth/simulated-auth.provider';
import type { ServerConfig } from './config/env.config';
import type { AppDeps, HonoEnv } from './http/app-context.type';
import { registerRoutes } from './http/contract-route.helper';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { localeMiddleware } from './middlewares/locale.middleware';
import { createRateLimiter } from './middlewares/rate-limit.middleware';
import { requestLog } from './middlewares/request-log.middleware';
import { apiSecureHeaders } from './middlewares/secure-headers.middleware';
import { sessionMiddleware } from './middlewares/session.middleware';
import { CatalogCache } from './modules/catalog/catalog.cache';
import { ALL_ROUTES } from './routes';
import { HtmlCache } from './web/html-cache';
import { mountSeo } from './web/seo.route';
import { mountWeb, type WebRuntime } from './web/web-handler';

export interface CreateAppOptions {
  db: Database;
  config: ServerConfig;
  /** Replaces the whole provider chain (tests). Default: Better Auth + simulated when AUTH_SIMULATED. */
  auth?: AuthProvider;
  /** Replaces Better Auth's session lookup (tests: a stubbed getSession). */
  sessionLookup?: SessionLookup;
  /** Server-rendered pages (apps/web). Absent = API only (tests, missing build). */
  web?: WebRuntime;
}

/** Builds the Hono app (no listening): main.ts serves it, tests call `app.request()`. */
export const createApp = ({ db, config, auth, sessionLookup, web }: CreateAppOptions) => {
  const catalog = new CatalogCache(db);
  // Rendered anonymous pages (production): any committed write may change what a page shows → drop them all.
  const htmlCache = new HtmlCache(web && !web.dev ? config.ssrCacheTtlSeconds * 1000 : 0);
  const repo = new BaseRepository(db, {
    onWrite: (table) => {
      catalog.onWrite(table);
      htmlCache.clear();
    },
  });
  const betterAuth = createBetterAuth(db, repo, config);
  const provider =
    auth ??
    createCompositeAuthProvider(
      createBetterAuthProvider(db, sessionLookup ?? { getSession: ({ headers }) => betterAuth.api.getSession({ headers }) }),
      config.authSimulated ? createSimulatedAuthProvider(db) : null,
    );
  const deps: AppDeps = {
    db,
    repo,
    catalog,
    auth: provider,
    config,
    rateLimiter: createRateLimiter(config.rateLimitEnabled),
  };
  const app = new Hono<HonoEnv>();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  app.use('*', requestLog(config.logRequests));
  // CSP: /api never loads anything (default-src 'none'); pages get a per-request nonce policy (web-handler).
  app.use('/api/*', apiSecureHeaders());
  // Language of every API answer (messages, labels, catalog content): before CORS/session so errors use it too.
  app.use('/api/*', localeMiddleware());
  app.use('/api/*', cors({ origin: config.corsOrigins, credentials: true, allowHeaders: ['content-type', SESSION_HEADER, LOCALE_HEADER], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  app.get('/api/health', (c) => c.json({ ok: true }));
  // Better Auth (Google sign-in, callback, sign-out, its own session endpoint): before our session middleware.
  app.on(['GET', 'POST'], `${AUTH_BASE_PATH}/*`, (c) => betterAuth.handler(c.req.raw));
  app.use('/api/*', sessionMiddleware(deps));
  registerRoutes(app, ALL_ROUTES);
  mountSeo(app, deps);
  if (web) mountWeb(app, web, config, htmlCache);
  return { app, deps, htmlCache, betterAuth };
};
