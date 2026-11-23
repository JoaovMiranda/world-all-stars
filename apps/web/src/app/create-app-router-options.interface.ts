import type { QueryClient } from '@tanstack/react-query';

export interface CreateAppRouterOptions {
  queryClient: QueryClient;
  /** Server: per-request CSP nonce put on every script/style the router renders. */
  nonce?: string | undefined;
}
