import { dehydrate, hydrate, QueryClientProvider } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ErrorPage } from '@/modules/errors/error.page';
import { PagePending } from '@/shared-ui/page-pending.component';
import type { AppRouter } from './app-router.type';
import type { CreateAppRouterOptions } from './create-app-router-options.interface';
import type { DehydratedApp } from './dehydrated-app.interface';
import { getBoot, initClientScope } from './request-scope';
import { routeTree } from './router';

/**
 * One router per server request (entry-server) and one in the browser (entry-client). The React Query cache and the
 * boot (fixture mode, session, today…) are dehydrated with the router and adopted before the first client render.
 */
export const createAppRouter = ({ queryClient, nonce }: CreateAppRouterOptions) =>
  createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
    // React Query owns caching: the loaders run on every navigation and hit its cache (staleTime 60 s).
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
    defaultErrorComponent: ErrorPage,
    // Slow navigation (page chunk + loader > 300 ms): a skeleton of the page frame instead of a frozen old page;
    // once shown it stays ≥ 400 ms so it never flashes.
    defaultPendingComponent: PagePending,
    defaultPendingMs: 300,
    defaultPendingMinMs: 400,
    ...(nonce ? { ssr: { nonce } } : {}),
    // Plain JSON data (contract responses); `as never` skips the router's deep serializability check of DehydratedState.
    dehydrate: () => ({ boot: getBoot(), queries: dehydrate(queryClient) }) as never,
    hydrate: (data: DehydratedApp) => {
      initClientScope({ boot: data.boot, queryClient });
      hydrate(queryClient, data.queries);
    },
    Wrap: ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>,
  });

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
