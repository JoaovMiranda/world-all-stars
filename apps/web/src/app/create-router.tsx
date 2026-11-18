import { type DehydratedState, dehydrate, hydrate, QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { ErrorPage } from '@/modules/errors/error.page';
import { PagePending } from '@/shared-ui/page-pending.component';

import { type Boot, getBoot, initClientScope } from './request-scope';
import { routeTree } from './router';

/** What travels from the server render to the browser with the router state (serialized by the router, seroval). */
interface DehydratedApp {
  boot: Boot;
  queries: DehydratedState;
}

interface CreateAppRouterOptions {
  queryClient: QueryClient;
  /** Server: per-request CSP nonce put on every script/style the router renders. */
  nonce?: string | undefined;
}

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

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
