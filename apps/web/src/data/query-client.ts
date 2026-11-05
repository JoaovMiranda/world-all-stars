import { QueryClient } from '@tanstack/react-query';

import { isApiError } from './api-error.error';

/** Single QueryClient of the app. 4xx errors are final (no retry); others retry once. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (failureCount, error) => !(isApiError(error) && error.status < 500) && failureCount < 1,
      refetchOnWindowFocus: false,
    },
  },
});
