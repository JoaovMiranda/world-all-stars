import { DEFAULT_LOCALE, FixtureMode, SessionKind, toIsoDate } from '@was/shared';
import { ANON_IDENTITY } from '@/session/session-identity.const';
import type { Boot } from './boot.interface';
import { IS_SERVER } from './request-scope.const';
import type { RequestScope } from './request-scope.interface';

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
