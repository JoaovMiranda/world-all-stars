import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './api-error.error';

/**
 * One QueryClient per server request and one in the browser (entry-client). 4xx errors are final (no retry);
 * others retry once in the browser. The server never retries: a failed query renders its skeleton and the
 * browser fetches it again after hydration.
 */
export const createQueryClient = ({ server = false }: { server?: boolean } = {}): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: server ? false : (failureCount, error) => !(isApiError(error) && error.status < 500) && failureCount < 1,
        refetchOnWindowFocus: false,
      },
    },
  });
