import type { SessionKind, SessionUser } from '@was/shared';
import { createContext, useContext } from 'react';

import type { LoginReason } from './session.const';

export interface SessionContextValue {
  kind: SessionKind;
  /** Signed-in user (null for visitors or while loading). */
  user: SessionUser | null;
  isSignedIn: boolean;
  isAdmin: boolean;
  /** Switches the simulated profile (header menu). */
  setKind: (kind: SessionKind) => void;
  /**
   * Gate for actions that need an account (vote, comment, reply, react): returns true when signed in, otherwise
   * opens the login popup (E1 placeholder) and returns false. `if (!requireLogin('vote')) return;`
   */
  requireLogin: (reason?: LoginReason) => boolean;
  /** Clears votes, comments and admin changes made in the demo. */
  resetDemo: () => void;
}

export const SessionContext = createContext<SessionContextValue | null>(null);

/** Simulated session (docs 17/20). Must be under <SessionProvider>. */
export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside <SessionProvider>');
  return value;
}
