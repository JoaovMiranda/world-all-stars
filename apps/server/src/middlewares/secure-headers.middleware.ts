import { randomBytes } from 'node:crypto';

import type { MiddlewareHandler } from 'hono';
import { secureHeaders } from 'hono/secure-headers';

import type { HonoEnv } from '../http/app-context.type';

const COMMON = { referrerPolicy: 'strict-origin-when-cross-origin', xFrameOptions: 'DENY' } as const;

/** /api: JSON only, nothing may load from it. */
export const apiSecureHeaders = (): MiddlewareHandler<HonoEnv> =>
  secureHeaders({ ...COMMON, contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } });

/** Images are links to Wikimedia (doc 02: never copied); fonts from Google Fonts. */
const IMG_SRC = ["'self'", 'data:', 'https://upload.wikimedia.org', 'https://thumb.wikimedia.org', 'https://commons.wikimedia.org'];

/**
 * Pages (SSR): a fresh nonce per response (`c.var.cspNonce`) that the renderer puts on every <script>/<style> it emits.
 * `style-src-attr 'unsafe-inline'` covers style="" attributes (React style props, ECharts SVG); no inline <script>
 * runs without the nonce. Dev adds what Vite needs: injected <style> tags (HMR), the websocket and its blob ping worker.
 */
export const pageSecureHeaders = ({ dev }: { dev: boolean }): MiddlewareHandler<HonoEnv> => async (c, next) => {
  const nonce = randomBytes(16).toString('base64');
  c.set('cspNonce', nonce);
  const directives = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}'`,
    `style-src 'self' https://fonts.googleapis.com${dev ? " 'unsafe-inline'" : ` 'nonce-${nonce}'`}`,
    "style-src-attr 'unsafe-inline'",
    'font-src https://fonts.gstatic.com',
    `img-src ${IMG_SRC.join(' ')}`,
    `connect-src 'self'${dev ? ' ws: wss:' : ''}`,
    // Dev: the Vite client pings the restarted server from a blob SharedWorker.
    ...(dev ? ["worker-src 'self' blob:"] : []),
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  await next();
  const h = c.res.headers;
  h.set('Content-Security-Policy', directives.join('; '));
  h.set('Referrer-Policy', COMMON.referrerPolicy);
  h.set('X-Frame-Options', COMMON.xFrameOptions);
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Resource-Policy', 'same-origin');
  if (!dev) h.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
};
