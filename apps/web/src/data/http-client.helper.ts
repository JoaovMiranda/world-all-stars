import { type ApiContract, ApiErrorSchema, buildApiPath, buildQueryString, HTTP_HEADER, LOCALE_HEADER, SessionKind } from '@was/shared';

import { getScope } from '@/app/request-scope';
import { localeStore } from '@/i18n/locale.store';
import { sessionStore } from '@/session/session.store';

import { ApiError } from './api-error.error';
import { API_BASE_URL } from './data-layer.const';
import type { HttpInput } from './http-input.interface';

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
    // Real sign-in = the Better Auth cookie (credentials). The simulated profile header only goes when a dev profile
    // is picked (the server honours it only with AUTH_SIMULATED, and a real session always wins).
    headers: {
      accept: 'application/json',
      ...(sessionStore.get() !== SessionKind.Anon ? { [HTTP_HEADER.session]: sessionStore.get() } : {}),
      // Current interface language: labels, validation errors and translated content come back in it.
      [LOCALE_HEADER]: localeStore.get(),
      ...(hasBody ? { 'content-type': 'application/json' } : {}),
      ...(scope.apiFetch ? { [HTTP_HEADER.ssr]: '1', ...(scope.cookie ? { cookie: scope.cookie } : {}) } : {}),
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
