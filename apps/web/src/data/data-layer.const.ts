/** Where data comes from: generated fixtures (default, no backend yet) or the Hono API (`VITE_DATA_SOURCE=http`). */
export const DATA_SOURCE: 'fixtures' | 'http' = import.meta.env.VITE_DATA_SOURCE === 'http' ? 'http' : 'fixtures';
/** Base URL of the API (empty = same origin; Vite proxies /api to apps/server in dev). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';
/** Simulated latency of fixture responses (keeps skeletons visible for a moment). */
export const FIXTURE_LATENCY_MS = 220;
/** URL search param and sessionStorage key of the fixture mode. */
export const FIXTURE_MODE_PARAM = 'fixture';
export const FIXTURE_MODE_STORAGE_KEY = 'was-fixture-mode';
