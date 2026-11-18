import fs from 'node:fs';
import path from 'node:path';

import { serveStatic } from '@hono/node-server/serve-static';
import { type Locale, LOCALE_COOKIE, resolveLocale } from '@was/shared';
import type { Context, Hono } from 'hono';
import { getCookie } from 'hono/cookie';

import type { ServerConfig } from '../config/env.config';
import type { HonoEnv } from '../http/app-context.type';
import { pageSecureHeaders } from '../middlewares/secure-headers.middleware';
import { type CachedPage, etagMatches, type HtmlCache, htmlEtag, isShareablePageRequest, PRIVATE_HTML_CACHE_CONTROL, PUBLIC_HTML_CACHE_CONTROL } from './html-cache';
import type { DocumentAssets, WebRenderModule } from './web-assets.helper';

/** How pages are produced: Vite dev (middleware mode) or the production build (dist/client + dist/server). */
export interface WebRuntime {
  dev: boolean;
  loadRenderer(): Promise<WebRenderModule>;
  assets(url: string): Promise<DocumentAssets>;
  /** Production: dist/client (hashed /assets/* and public files). Dev: Vite serves them before Hono. */
  clientDir?: string;
  /** Dev: maps SSR stack traces back to the sources. */
  fixStacktrace?(error: unknown): void;
}

const IMMUTABLE = 'public, max-age=31536000, immutable';
// HTML caching (docs 05/12): anonymous pages are public (CDN s-maxage + in-process LRU in production, dropped on any
// write); pages with app cookies, ?as=/?fixture=, account/admin and non-200 are `private, no-cache`.
// Language (doc 12 i18n): same URL, so pages vary by the `was_locale` cookie and Accept-Language. The locale is a
// cacheable variant (not personal): it is part of the in-process cache key and of `Vary`, never makes a page private.
const PAGE_VARY = 'Cookie, Accept-Language';
/** Locale of a page request: the same rule the renderer (boot) and the API apply (cookie → Accept-Language → pt-BR). */
export const pageLocale = (c: Context<HonoEnv>): Locale => resolveLocale({ cookie: getCookie(c, LOCALE_COOKIE), acceptLanguage: c.req.header('accept-language') });
/** In-process cache key: one entry per language of each path + search. */
export const pageCacheKey = (locale: Locale, url: URL): string => `${locale}|${url.pathname}${url.search}`;
const isApi = (p: string) => p === '/api' || p.startsWith('/api/');

/** A shareable page (fresh render or cache hit): CDN-ready headers, 304 when the client already has these bytes. */
const respond = (c: Context<HonoEnv>, page: Pick<CachedPage, 'status' | 'headers' | 'body' | 'etag'>, ifNoneMatch: string | undefined) => {
  const headers = new Headers(page.headers);
  headers.set('Cache-Control', PUBLIC_HTML_CACHE_CONTROL);
  headers.set('ETag', page.etag);
  headers.set('Vary', PAGE_VARY);
  headers.set('Content-Language', c.get('locale'));
  if (etagMatches(ifNoneMatch, page.etag)) {
    headers.delete('content-type');
    return c.body(null, 304, Object.fromEntries(headers));
  }
  return new Response(page.body, { status: page.status, headers });
};

/**
 * Mounts the web app after the API: static files (production) then SSR for every other GET. The API is called
 * in-process by the renderer (`app.fetch`), so a page needs no network hop and shares the session rules.
 */
export const mountWeb = (app: Hono<HonoEnv>, web: WebRuntime, config: ServerConfig, cache: HtmlCache): void => {
  if (web.clientDir) {
    const root = path.relative(process.cwd(), web.clientDir) || '.';
    app.use(
      '/assets/*',
      serveStatic({ root, onFound: (_path, c) => c.header('Cache-Control', IMMUTABLE) }),
      // A missing hashed asset is a 404, never a page.
      async (c) => c.text('Not Found', 404),
    );
    // Public files (favicon…). Dot-paths (.vite/manifest.json) are never served.
    app.use('*', async (c, next) => {
      if (c.req.method !== 'GET' || c.req.path.split('/').some((s) => s.startsWith('.'))) return next();
      const file = path.join(web.clientDir as string, c.req.path);
      if (c.req.path === '/' || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
      return serveStatic({ root, onFound: (_p, ctx) => ctx.header('Cache-Control', 'public, max-age=3600') })(c, next);
    });
  }

  const pageHeaders = pageSecureHeaders({ dev: web.dev });
  app.use('*', (c, next) => (isApi(c.req.path) ? next() : pageHeaders(c, next)));
  app.get('*', async (c) => {
    if (isApi(c.req.path)) return c.notFound();
    const url = new URL(c.req.url);
    const shareable = isShareablePageRequest(url, c.req.header('cookie'));
    const locale = pageLocale(c);
    c.set('locale', locale);
    const key = pageCacheKey(locale, url);
    const ifNoneMatch = c.req.header('if-none-match');
    c.header('Vary', PAGE_VARY);
    c.header('Content-Language', locale);

    const cached = shareable && !web.dev ? cache.get(key) : undefined;
    if (cached) {
      c.set('cspNonce', cached.nonce); // the stored body carries this nonce
      return respond(c, cached, ifNoneMatch);
    }
    try {
      const [renderer, assets] = await Promise.all([web.loadRenderer(), web.assets(c.req.path)]);
      const nonce = c.var.cspNonce;
      const response = await renderer.render({
        request: c.req.raw,
        nonce,
        apiFetch: (request) => Promise.resolve(app.fetch(request)),
        timeZone: config.appTimeZone,
        publicUrl: config.publicUrl,
        assets,
      });
      const headers = new Headers(response.headers);
      headers.set('Vary', PAGE_VARY);
      headers.set('Content-Language', locale);
      const isHtml = headers.get('content-type')?.startsWith('text/html') ?? false;
      if (!isHtml) return new Response(response.body, { status: response.status, headers });
      if (!shareable || response.status !== 200) {
        // Personalized or error page: streamed as rendered, never stored by shared caches.
        headers.set('Cache-Control', PRIVATE_HTML_CACHE_CONTROL);
        return new Response(response.body, { status: response.status, headers });
      }
      // Anonymous 200: buffered once to get a validator; stored in the in-process cache (production).
      const body = await response.text();
      const page = { status: 200, headers: [...headers.entries()], body, etag: htmlEtag(body), nonce };
      if (!web.dev) cache.set(key, page);
      return respond(c, page, ifNoneMatch);
    } catch (error) {
      web.fixStacktrace?.(error);
      console.error(`[web] SSR failed for ${c.req.path}`, error);
      return c.text('Internal Server Error', 500);
    }
  });
};
