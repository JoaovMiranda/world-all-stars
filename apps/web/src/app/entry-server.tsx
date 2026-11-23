import { AsyncLocalStorage } from 'node:async_hooks';

import { rootRouteId } from '@tanstack/react-router';
import { createRequestHandler, defaultStreamHandler } from '@tanstack/react-router/ssr/server';

import { createQueryClient } from '@/data/query-client';

import { resolveBoot } from './boot.helper';
import { createAppRouter } from './create-router';
import type { DocumentAssets } from './document-assets.interface';
import type { RenderOptions } from './render-options.interface';
import { registerServerScope } from './request-scope';
import type { RequestScope } from './request-scope.interface';
import { routeTree } from './router';

const storage = new AsyncLocalStorage<RequestScope>();

/** Router manifest: document assets on the root route + modulepreload of each page route's own chunks. */
const buildManifest = ({ routeChunks = {}, ...root }: DocumentAssets) => {
  const routes: Record<string, { preloads?: string[]; scripts?: DocumentAssets['scripts']; css?: string[] }> = { [rootRouteId]: root };
  const children = Object.values((routeTree.children ?? {}) as Record<string, { id: string; options: { staticData?: { pageModule?: string } } }>);
  for (const route of children) {
    const chunks = route.options.staticData?.pageModule ? routeChunks[route.options.staticData.pageModule] : undefined;
    if (chunks?.length) routes[route.id] = { preloads: chunks };
  }
  return { routes };
};
registerServerScope(() => storage.getStore());

/**
 * Server entry (doc 12): renders the page for one request with TanStack Router SSR (streaming), with a fresh
 * router + QueryClient + request scope. Redirects come back as 3xx responses, unknown routes as 404.
 */
export const render = ({ request, nonce, apiFetch, timeZone, publicUrl, assets }: RenderOptions): Promise<Response> => {
  const cookie = request.headers.get('cookie');
  const boot = resolveBoot({ url: new URL(request.url), cookie, timeZone, publicUrl, acceptLanguage: request.headers.get('accept-language') });
  const queryClient = createQueryClient({ server: true });
  const scope: RequestScope = { boot, queryClient, apiFetch, ...(cookie ? { cookie } : {}) };
  const manifest = buildManifest(assets);
  return storage.run(scope, () =>
    createRequestHandler({
      request,
      createRouter: () => createAppRouter({ queryClient, nonce }),
      getRouterManifest: async () => manifest,
    })(defaultStreamHandler),
  );
};
