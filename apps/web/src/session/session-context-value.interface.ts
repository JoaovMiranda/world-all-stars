import type { SessionKind, SessionUser } from '@was/shared';
import type { LoginReason } from './login-reason.type';

export interface SessionContextValue {
  kind: SessionKind;
  /** Signed-in user (null for visitors or while loading). */
  user: SessionUser | null;
  isSignedIn: boolean;
  isAdmin: boolean;
  /** The dev profile switcher is available (fixtures, or AUTH_SIMULATED on the server). */
  simulationAvailable: boolean;
  /** Switches the simulated profile (header menu, dev only). */
  setKind: (kind: SessionKind) => void;
  /** Ends the session (Google/Better Auth and the simulated profile) and refetches everything personal. */
  signOut: () => Promise<void>;
  /**
   * Gate for actions that need an account (vote, comment, reply, react): returns true when signed in, otherwise
   * opens the login popup (Google) and returns false. `if (!requireLogin('vote')) return;`
   */
  requireLogin: (reason?: LoginReason) => boolean;
  /** Clears votes, comments and admin changes made in the demo. */
  resetDemo: () => void;
}
