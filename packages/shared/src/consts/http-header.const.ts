/**
 * First-party cookies the server render reads (simulated session, fixture mode, theme). A page request carrying any
 * of them is personalized: never shared by caches.
 */
export const APP_COOKIE = { session: 'was_session', fixture: 'was_fixture', theme: 'was-theme', motion: 'was-motion' } as const;
export const APP_COOKIE_NAMES: readonly string[] = Object.values(APP_COOKIE);

/**
 * Prefix of the Better Auth cookies (`was.session_token`, `was.session_data`, `was.state`…; `__Secure-was.*` over
 * HTTPS). Any of them means a signed-in (or signing-in) browser: the page is personal.
 */
export const AUTH_COOKIE_PREFIX = 'was';
/** Where the server mounts Better Auth (Google callback: `<origin>/api/auth/callback/google`). */
export const AUTH_BASE_PATH = '/api/auth';

/** Custom HTTP headers shared by the web client and the server. */
export const HTTP_HEADER = {
  /** Simulated session kind (dev): anon · reader · admin (apps/server simulated-auth.provider). */
  session: 'x-was-session',
  /** Marks the in-process API calls made by the server render (logged as `ssr→api`, not as client traffic). */
  ssr: 'x-was-ssr',
} as const;
