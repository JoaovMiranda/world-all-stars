import type { ApiContract } from '../types/api-contract.type';

/** Identity helper that keeps the literal types of a contract (method, path, schemas). */
export const defineContract = <const C extends ApiContract>(contract: C): C => contract;

/** Replaces `:name` placeholders with URL-encoded params (`/api/athletes/:slug` → `/api/athletes/pele`). */
export const buildApiPath = (path: string, params?: Record<string, unknown>): string =>
  path.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => {
    const value = params?.[key];
    if (value === undefined || value === null || value === '') throw new Error(`Missing path param "${key}" for ${path}`);
    return encodeURIComponent(String(value));
  });

/** Serializes a flat query object (undefined/empty dropped, arrays joined by comma). */
export const buildQueryString = (query?: Record<string, unknown>): string => {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const s = params.toString();
  return s ? `?${s}` : '';
};
