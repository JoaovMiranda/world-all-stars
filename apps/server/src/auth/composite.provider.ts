import { SessionKind } from '@was/shared';

import type { AuthProvider } from './auth-provider.type';

/**
 * Better Auth first; the simulated switcher only when AUTH_SIMULATED (never in production: loadConfig throws).
 * A real session (even pending consent) always wins over a simulated cookie/header.
 */
export const createCompositeAuthProvider = (primary: AuthProvider, simulated: AuthProvider | null): AuthProvider => ({
  name: simulated ? `${primary.name}+${simulated.name}` : primary.name,
  async resolve(req) {
    const session = await primary.resolve(req);
    if (session.kind !== SessionKind.Anon || session.pending || !simulated) return session;
    return simulated.resolve(req);
  },
});
