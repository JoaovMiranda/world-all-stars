import { createContext, useContext } from 'react';
import type { SessionContextValue } from './session-context-value.interface';

export const SessionContext = createContext<SessionContextValue | null>(null);

/** Current session (Google via Better Auth, or the dev simulated profile). Must be under <SessionProvider>. */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
