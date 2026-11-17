/** Where data comes from: generated fixtures (default, no backend yet) or the Hono API (`VITE_DATA_SOURCE=http`). */
export const DATA_SOURCE: 'fixtures' | 'http' = import.meta.env.VITE_DATA_SOURCE === 'http' ? 'http' : 'fixtures';
/** Base URL of the API in the browser (empty = same origin: the Hono server serves pages and /api). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';
/** Header of the simulated session on the API (apps/server simulated-auth.provider). */
export const SESSION_HEADER = 'x-was-session';
/** Simulated latency of fixture responses (keeps skeletons visible for a moment). */
export const FIXTURE_LATENCY_MS = 220;
/** URL search param and cookie (kept until the browser closes, read by the server render) of the fixture mode. */
export const FIXTURE_MODE_PARAM = 'fixture';
export const FIXTURE_MODE_COOKIE = 'was_fixture';
