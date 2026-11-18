import { SessionKind } from '../enums/session-kind.enum';

/**
 * Accounts behind the SIMULATED sessions (no real auth yet): `?as=reader|admin` in the web, `x-was-session` on the
 * API, only with AUTH_SIMULATED (dev; forbidden in production). They come from the prototype seed (doc 04).
 */
export const DEMO_SESSION_EMAILS = {
  [SessionKind.Reader]: 'voce@exemplo.invalid',
  [SessionKind.Admin]: 'admin@exemplo.invalid',
} as const;
