import type { QueryClient } from '@tanstack/react-query';
import type { Boot } from './boot.interface';

/** Per-request state: AsyncLocalStorage on the server (entry-server), one module-level scope in the browser. */
export interface RequestScope {
  boot: Boot;
  queryClient?: QueryClient;
  /** SSR only: calls the API in-process (Hono `app.fetch`), no network hop. */
  apiFetch?: (request: Request) => Promise<Response>;
  /** SSR only: Cookie header of the page request, forwarded to the in-process API calls. */
  cookie?: string;
}
