import { BaseRepository, type Database } from '@was/db';
import { ApiErrorCode, LOCALE_HEADER } from '@was/shared';
import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { httpInstrumentationMiddleware } from '@hono/otel';
import { timing } from 'hono/timing';
import { sql } from 'drizzle-orm';

import type { AuthProvider } from './auth/auth-provider.type';
import { AUTH_BASE_PATH, createBetterAuth } from './auth/better-auth.config';
import { createBetterAuthProvider, type SessionLookup } from './auth/better-auth.provider';
import { createCompositeAuthProvider } from './auth/composite.provider';
import { createSimulatedAuthProvider, SESSION_HEADER } from './auth/simulated-auth.provider';
import type { ServerConfig } from './config/env.config';
import type { AppDeps, HonoEnv } from './http/app-context.type';
import { registerRoutes } from './http/contract-route.helper';
import { httpError } from './http/http-error.error';
import { compress } from './middlewares/compress.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { localeMiddleware } from './middlewares/locale.middleware';
import { requestLog } from './middlewares/request-log.middleware';
import { apiSecureHeaders } from './middlewares/secure-headers.middleware';
import { sessionMiddleware } from './middlewares/session.middleware';
import { CatalogCache } from './modules/catalog/catalog.cache';
import { createRateLimitStore } from './rate-limit/rate-limit.store';
import { createRateLimiter } from './rate-limit/rate-limiter';
import { ALL_ROUTES } from './routes';
import { affectsPublicPages, HtmlCache } from './web/html-cache';
import { mountImageProxy } from './web/image-proxy.route';
import { mountSeo } from './web/seo.route';
import { mountSlugRedirects } from './web/slug-redirect';
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
  /** Upstream fetch of the image proxy (tests: a stub instead of Wikimedia). */
  imageFetch?: typeof fetch;
}

/** Builds the Hono app (no listening): main.ts serves it, tests call `app.request()`. */
export const createApp = ({ db, config, auth, sessionLookup, web, imageFetch }: CreateAppOptions) => {
  const catalog = new CatalogCache(db);
  // Rendered anonymous pages (production): dropped when a table they show changes (catalog, comments, votes).
  // Private writes (notifications, contact, suggestions, consents, sessions…) keep them: they never appear there.
  const htmlCache = new HtmlCache(web && !web.dev ? config.ssrCacheTtlSeconds * 1000 : 0);
  const repo = new BaseRepository(db, {
    onWrite: (table) => {
      catalog.onWrite(table);
      if (affectsPublicPages(table)) htmlCache.clear();
    },
  });
  // Rate-limit counters (API buckets + Better Auth): the database table is shared by every instance.
  const rateLimitStore = createRateLimitStore(config.rateLimitStore, db);
  const betterAuth = createBetterAuth(db, repo, config, rateLimitStore);
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
    rateLimiter: createRateLimiter(rateLimitStore, config.rateLimitEnabled),
  };
  const dbPing = () => db.execute(sql`select 1`).then(() => true, () => false);
  const app = new Hono<HonoEnv>();
  app.onError(errorHandler);
  app.notFound(notFoundHandler);
  // OpenTelemetry span per request (only when tracing is configured: see observability/instrumentation.ts).
  if (config.otelEndpoint) app.use('*', httpInstrumentationMiddleware({ serviceName: 'world-all-stars' }));
  app.use('*', requestLog({ enabled: config.logRequests, format: config.logFormat, slowMs: config.slowRequestMs }));
  // Brotli/gzip for pages, API JSON and SEO files (hashed /assets are precompressed at build time).
  app.use('*', compress());
  // Server-Timing (total + ssr on pages): the server's share of every response, visible in DevTools and to RUM tools.
  app.use('*', timing({ crossOrigin: false, totalDescription: 'server' }));
  // CSP: /api never loads anything (default-src 'none'); pages get a per-request nonce policy (web-handler).
  app.use('/api/*', apiSecureHeaders());
  // Language of every API answer (messages, labels, catalog content): before CORS/session so errors use it too.
  app.use('/api/*', localeMiddleware());
  app.use('/api/*', cors({ origin: config.corsOrigins, credentials: true, allowHeaders: ['content-type', SESSION_HEADER, LOCALE_HEADER], allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] }));
  // Bodies above the limit are refused while streaming in (413), before any JSON parsing or database work.
  app.use('/api/*', bodyLimit({ maxSize: config.bodyLimitBytes, onError: () => { throw httpError(413, ApiErrorCode.PayloadTooLarge, 'payloadTooLarge'); } }));
  // Liveness + database (load balancer / Docker HEALTHCHECK): 503 when the database does not answer within 2 s.
  app.get('/api/health', async (c) => {
    const db = await Promise.race([dbPing(), new Promise<false>((resolve) => setTimeout(() => resolve(false), 2_000).unref())]);
    return c.json({ ok: db, db: db ? 'up' : 'down' }, db ? 200 : 503);
  });
  // Better Auth (Google sign-in, callback, sign-out, its own session endpoint): before our session middleware.
  app.on(['GET', 'POST'], `${AUTH_BASE_PATH}/*`, (c) => betterAuth.handler(c.req.raw));
  app.use('/api/*', sessionMiddleware(deps));
  registerRoutes(app, ALL_ROUTES);
  mountSeo(app, deps);
  // Wikimedia thumbnails from our own origin (LCP photo on the same connection, long cache, no third-party cookie).
  mountImageProxy(app, deps, {
    ...config.imageProxy,
    userAgent: `WorldAllStars-ImageProxy/1.0 (+${config.publicUrl})`,
    ...(imageFetch ? { fetch: imageFetch } : {}),
  });
  if (web) {
    mountSlugRedirects(app, deps);
    mountWeb(app, web, config, htmlCache);
  }
  return { app, deps, htmlCache, betterAuth };
};
