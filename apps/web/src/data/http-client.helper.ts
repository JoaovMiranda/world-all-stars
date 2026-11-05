import { type ApiContract, ApiErrorSchema, buildApiPath, buildQueryString } from '@was/shared';

import { ApiError } from './api-error.error';
import { API_BASE_URL } from './data-layer.const';

interface HttpInput {
  params?: Record<string, unknown>;
  query?: Record<string, unknown>;
  body?: unknown;
}

/** Calls the real API described by a shared contract. Returns raw JSON (the caller validates it). */
export const httpRequest = async (contract: ApiContract, input: HttpInput, signal?: AbortSignal): Promise<unknown> => {
  const url = `${API_BASE_URL}${buildApiPath(contract.path, input.params)}${buildQueryString(input.query)}`;
  const hasBody = input.body !== undefined;
  const response = await fetch(url, {
    method: contract.method,
    credentials: 'include',
    headers: { accept: 'application/json', ...(hasBody ? { 'content-type': 'application/json' } : {}) },
    ...(hasBody ? { body: JSON.stringify(input.body) } : {}),
    ...(signal ? { signal } : {}),
  });
  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const parsed = ApiErrorSchema.safeParse(json);
    throw new ApiError(response.status, parsed.success ? parsed.data : { error: `http_${response.status}` });
  }
  return json;
};
