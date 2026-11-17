import fs from 'node:fs';
import path from 'node:path';

import { serveStatic } from '@hono/node-server/serve-static';
import type { Hono } from 'hono';

import type { ServerConfig } from '../config/env.config';
import type { HonoEnv } from '../http/app-context.type';
import { pageSecureHeaders } from '../middlewares/secure-headers.middleware';
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
const isApi = (p: string) => p === '/api' || p.startsWith('/api/');

/**
 * Mounts the web app after the API: static files (production) then SSR for every other GET. The API is called
 * in-process by the renderer (`app.fetch`), so a page needs no network hop and shares the session rules.
 */
export const mountWeb = (app: Hono<HonoEnv>, web: WebRuntime, config: ServerConfig): void => {
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
    try {
      const [renderer, assets] = await Promise.all([web.loadRenderer(), web.assets(c.req.path)]);
      const response = await renderer.render({
        request: c.req.raw,
        nonce: c.var.cspNonce,
        apiFetch: (request) => Promise.resolve(app.fetch(request)),
        timeZone: config.appTimeZone,
        publicUrl: config.publicUrl,
        assets,
      });
      // Fresh Response: headers are set by the middlewares afterwards (CSP, …); HTML is per-user (cookies), never shared.
      const headers = new Headers(response.headers);
      if (headers.get('content-type')?.startsWith('text/html')) headers.set('Cache-Control', 'private, no-cache');
      return new Response(response.body, { status: response.status, headers });
    } catch (error) {
      web.fixStacktrace?.(error);
      console.error(`[web] SSR failed for ${c.req.path}`, error);
      return c.text('Internal Server Error', 500);
    }
  });
};
