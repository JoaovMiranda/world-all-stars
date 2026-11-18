import { DEFAULT_LOCALE, FixtureMode, type IsoDate, type Locale, SessionKind, toIsoDate } from '@was/shared';
import type { QueryClient } from '@tanstack/react-query';

import { ANON_IDENTITY } from '@/session/session-identity.helper';
import type { ThemeName } from '@/shared-ui/theme.const';

/**
 * What the server decided for this page load and the client must reuse to hydrate the same markup
 * (sent with the router's dehydrated state). Times come from the server so "today" never differs.
 */
export interface Boot {
  fixtureMode: FixtureMode;
  sessionKind: SessionKind;
  /**
   * Who the API says is browsing (`kind:userId` from GET /api/session, session-identity.helper): part of every
   * personalized query key, so data of one account never shows for another after a sign-in/out.
   */
  identity: string;
  /** YYYY-MM-DD in `timeZone` (APP_TIME_ZONE on the server). */
  today: IsoDate;
  /** ISO instant of the request. */
  now: string;
  timeZone: string;
  /** Absolute origin used in canonical/og URLs (PUBLIC_URL). */
  publicUrl: string;
  /** Manual theme from the `was-theme` cookie (null = follow the OS). */
  theme: ThemeName | null;
  /** "Pausar animações" from the `was-motion` cookie: <html data-motion="reduced"> on the first paint. */
  motionPaused: boolean;
  /** Interface language: `was_locale` cookie → Accept-Language → pt-BR (switchable in place: locale.store). */
  locale: Locale;
}

/** Per-request state: AsyncLocalStorage on the server (entry-server), one module-level scope in the browser. */
export interface RequestScope {
  boot: Boot;
  queryClient?: QueryClient;
  /** SSR only: calls the API in-process (Hono `app.fetch`), no network hop. */
  apiFetch?: (request: Request) => Promise<Response>;
  /** SSR only: Cookie header of the page request, forwarded to the in-process API calls. */
  cookie?: string;
}

/** True while rendering on the server (and in node tests): there is no DOM. */
export const IS_SERVER = typeof document === 'undefined';

const localBoot = (): Boot => {
  const now = new Date();
  return {
    fixtureMode: FixtureMode.Sample,
    sessionKind: SessionKind.Anon,
    identity: ANON_IDENTITY,
    today: toIsoDate(now),
    now: now.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    publicUrl: IS_SERVER ? 'http://localhost:8787' : window.location.origin,
    theme: null,
    motionPaused: false,
    locale: DEFAULT_LOCALE,
  };
};

let serverScope: (() => RequestScope | undefined) | undefined;
let clientScope: RequestScope | undefined;

/** entry-server registers its AsyncLocalStorage reader (keeps node:async_hooks out of the client bundle). */
export const registerServerScope = (read: () => RequestScope | undefined): void => {
  serverScope = read;
};

/** Current request scope. Outside a request (module load, unit tests) a local default is used. */
export const getScope = (): RequestScope => serverScope?.() ?? (clientScope ??= { boot: localBoot() });

export const getBoot = (): Boot => getScope().boot;

/** Browser: adopts the boot of the server render (called by router.hydrate before the first render). */
export const initClientScope = (patch: Partial<RequestScope>): void => {
  clientScope = { ...getScope(), ...patch };
};
