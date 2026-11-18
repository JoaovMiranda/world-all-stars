import { APP_COOKIE } from '@was/shared';

/** Where data comes from: generated fixtures (default, no backend yet) or the Hono API (`VITE_DATA_SOURCE=http`). */
export const DATA_SOURCE: 'fixtures' | 'http' = import.meta.env.VITE_DATA_SOURCE === 'http' ? 'http' : 'fixtures';
/** Base URL of the API in the browser (empty = same origin: the Hono server serves pages and /api). */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? '';
/** Simulated latency of fixture responses (keeps skeletons visible for a moment). */
export const FIXTURE_LATENCY_MS = 220;
/** Fixtures were generated from the pt-BR prototype: detail responses report their content as pt-BR (doc 12 i18n). */
export const FIXTURE_CONTENT_LOCALE = 'pt-BR' as const;
/** URL search param and cookie (kept until the browser closes, read by the server render) of the fixture mode. */
export const FIXTURE_MODE_PARAM = 'fixture';
export const FIXTURE_MODE_COOKIE = APP_COOKIE.fixture;
