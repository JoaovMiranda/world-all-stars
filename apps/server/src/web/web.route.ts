import fs from 'node:fs';
import path from 'node:path';
import { serveStatic } from '@hono/node-server/serve-static';
import type { Hono } from 'hono';
import { endTime, startTime } from 'hono/timing';
import type { ServerConfig } from '../config/server-config.type';
import { CACHE_CONTROL } from '../consts/cache-control.const';
import type { HonoEnv } from '../http/app-context.type';
import type { SsrSessionMemo } from '../http/ssr-session-memo.interface';
import { pageSecureHeaders } from '../middlewares/secure-headers.middleware';
import type { HtmlCache } from './html.cache';
import { htmlEtag, isShareablePageRequest } from './html-cache.helper';
import { SsrTimeoutError } from './ssr-timeout.error';
import { PAGE_VARY } from './web.const';
import { isApi, pageCacheKey, pageLocale, respond, withTimeout } from './web.helper';
import type { WebRuntime } from './web-runtime.interface';

/**
 * Mounts the web app after the API: static files (production) then SSR for every other GET. The API is called
 * in-process by the renderer (`app.fetch`), so a page needs no network hop and shares the session rules.
 */
export const mountWeb = (app: Hono<HonoEnv>, web: WebRuntime, config: ServerConfig, cache: HtmlCache): void => {
  if (web.clientDir) {
    const root = path.relative(process.cwd(), web.clientDir) || '.';
    app.use(
      '/assets/*',
      // precompressed: the web build writes .br/.gz next to each JS/CSS/SVG file (scripts/precompress.mjs).
      serveStatic({ root, precompressed: true, onFound: (_path, c) => c.header('Cache-Control', CACHE_CONTROL.immutableAsset) }),
      // A missing hashed asset is a 404, never a page.
      async (c) => c.text('Not Found', 404),
    );
    // Public files (favicon…). Dot-paths (.vite/manifest.json) are never served.
    app.use('*', async (c, next) => {
      if (c.req.method !== 'GET' || c.req.path.split('/').some((s) => s.startsWith('.'))) return next();
      const file = path.join(web.clientDir as string, c.req.path);
      if (c.req.path === '/' || !fs.existsSync(file) || !fs.statSync(file).isFile()) return next();
      return serveStatic({ root, onFound: (_p, ctx) => ctx.header('Cache-Control', CACHE_CONTROL.staticFile) })(c, next);
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
      const hit = respond(c, cached, ifNoneMatch);
      hit.headers.set('x-cache', 'HIT'); // in-process cache: no render (no `ssr` in Server-Timing)
      return hit;
    }
    try {
      const [renderer, assets] = await Promise.all([web.loadRenderer(), web.assets(c.req.path)]);
      const nonce = c.var.cspNonce;
      const ssrSession: SsrSessionMemo = {};
      startTime(c, 'ssr', 'render');
      const response = await withTimeout(
        config.ssrTimeoutMs,
        renderer.render({
          request: c.req.raw,
          nonce,
          apiFetch: (request) => Promise.resolve(app.fetch(request, { ssrSession })),
          timeZone: config.appTimeZone,
          publicUrl: config.publicUrl,
          assets,
        }),
      );
      endTime(c, 'ssr');
      const headers = new Headers(response.headers);
      headers.set('Vary', PAGE_VARY);
      headers.set('Content-Language', locale);
      const isHtml = headers.get('content-type')?.startsWith('text/html') ?? false;
      if (!isHtml) return new Response(response.body, { status: response.status, headers });
      if (!shareable || response.status !== 200) {
        // Personalized or error page: streamed as rendered, never stored by shared caches.
        headers.set('Cache-Control', CACHE_CONTROL.privateHtml);
        return new Response(response.body, { status: response.status, headers });
      }
      // Anonymous 200: buffered once to get a validator; stored in the in-process cache (production).
      const body = await response.text();
      const page = { status: 200, headers: [...headers.entries()], body, etag: htmlEtag(body), nonce };
      if (!web.dev) cache.set(key, page);
      return respond(c, page, ifNoneMatch);
    } catch (error) {
      if (error instanceof SsrTimeoutError) {
        console.error(`[web] SSR timed out after ${config.ssrTimeoutMs}ms for ${c.req.path}`);
        return c.text('Service Unavailable', 503, { 'Retry-After': '5', 'Cache-Control': CACHE_CONTROL.privateHtml });
      }
      web.fixStacktrace?.(error);
      console.error(`[web] SSR failed for ${c.req.path}`, error);
      return c.text('Internal Server Error', 500);
    }
  });
};
