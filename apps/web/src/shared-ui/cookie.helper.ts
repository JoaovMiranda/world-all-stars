/** Reads one cookie from a `Cookie` header (server) or `document.cookie` (browser). */
export const readCookie = (header: string | null | undefined, name: string): string | undefined => {
  for (const part of (header ?? '').split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1 || part.slice(0, eq).trim() !== name) continue;
    try {
      return decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const YEAR_SECONDS = 365 * 24 * 60 * 60;

/**
 * Browser only: first-party preference cookie (read by the server render). `session` = until the browser closes,
 * otherwise one year. Not HttpOnly on purpose: the page itself switches these preferences.
 */
export const writeCookie = (name: string, value: string, lifetime: 'session' | 'year' = 'year'): void => {
  const maxAge = lifetime === 'year' ? `; max-age=${YEAR_SECONDS}` : '';
  const secure = window.location.protocol === 'https:' ? '; secure' : '';
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; samesite=lax${maxAge}${secure}`;
};
