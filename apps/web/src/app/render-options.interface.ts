import type { DocumentAssets } from './document-assets.interface';

/** Contract with apps/server (src/web/web.route.ts): one call per page request. */
export interface RenderOptions {
  request: Request;
  /** Per-request CSP nonce (the server sends the matching Content-Security-Policy header). */
  nonce: string;
  /** The API, in-process (Hono `app.fetch`). */
  apiFetch: (request: Request) => Promise<Response>;
  /** APP_TIME_ZONE: "today" of the page. */
  timeZone: string;
  /** PUBLIC_URL: canonical/og URLs. */
  publicUrl: string;
  assets: DocumentAssets;
}
