import { type ApiContract, ApiErrorSchema, buildApiPath, buildQueryString } from '@was/shared';

import { getScope } from '@/app/request-scope';
import { sessionStore } from '@/session/session.store';

import { ApiError } from './api-error.error';
import { API_BASE_URL, SESSION_HEADER } from './data-layer.const';

interface HttpInput {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
}

/** Origin of the in-process requests made during SSR (never leaves the process). */
const SSR_ORIGIN = 'http://ssr.internal';

/**
 * Calls the real API described by a shared contract. Returns raw JSON (the caller validates it).
 * Browser: `fetch` to the same origin. Server render: the Hono app in-process (`scope.apiFetch`), with the page's cookies.
 */
export const httpRequest = async (contract: ApiContract, input: HttpInput, signal?: AbortSignal): Promise<unknown> => {
  const path = `${buildApiPath(contract.path, input.params)}${buildQueryString(input.query)}`;
  const hasBody = input.body !== undefined;
  const scope = getScope();
  const init: RequestInit = {
    method: contract.method,
    credentials: 'include',
    // Simulated session (dev): the server maps it to the demo accounts. Better Auth will use its cookie instead.
    headers: {
      accept: 'application/json',
      [SESSION_HEADER]: sessionStore.get(),
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(scope.apiFetch && scope.cookie ? { cookie: scope.cookie } : {}),
    },
    ...(hasBody ? { body: JSON.stringify(input.body) } : {}),
    ...(signal ? { signal } : {}),
  };
  const response = scope.apiFetch ? await scope.apiFetch(new Request(`${SSR_ORIGIN}${path}`, init)) : await fetch(`${API_BASE_URL}${path}`, init);
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = ApiErrorSchema.safeParse(json);
    throw new ApiError(response.status, parsed.success ? parsed.data : { error: `http_${response.status}` });
  }
  return json;
};
