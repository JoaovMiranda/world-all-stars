import { AsyncLocalStorage } from 'node:async_hooks';

import { rootRouteId } from '@tanstack/react-router';
import { createRequestHandler, defaultStreamHandler } from '@tanstack/react-router/ssr/server';

import { createQueryClient } from '@/data/query-client';

import { resolveBoot } from './boot.helper';
import { createAppRouter } from './create-router';
import { registerServerScope, type RequestScope } from './request-scope';

/** Assets of the document: client entry (+ dev preamble), stylesheets and module preloads (from the Vite manifest). */
export interface DocumentAssets {
  scripts: { attrs?: Record<string, string | boolean>; children?: string }[];
  css: string[];
  preloads: string[];
}

/** Contract with apps/server (src/web/web-handler.ts): one call per page request. */
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

const storage = new AsyncLocalStorage<RequestScope>();
registerServerScope(() => storage.getStore());

/**
 * Server entry (doc 12): renders the page for one request with TanStack Router SSR (streaming), with a fresh
 * router + QueryClient + request scope. Redirects come back as 3xx responses, unknown routes as 404.
 */
export const render = ({ request, nonce, apiFetch, timeZone, publicUrl, assets }: RenderOptions): Promise<Response> => {
  const cookie = request.headers.get('cookie');
  const boot = resolveBoot({ url: new URL(request.url), cookie, timeZone, publicUrl });
  const queryClient = createQueryClient({ server: true });
  const scope: RequestScope = { boot, queryClient, apiFetch, ...(cookie ? { cookie } : {}) };
  const manifest = { routes: { [rootRouteId]: assets } };
  return storage.run(scope, () =>
    createRequestHandler({
      request,
      createRouter: () => createAppRouter({ queryClient, nonce }),
      getRouterManifest: async () => manifest,
    })(defaultStreamHandler),
  );
};
