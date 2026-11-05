import { SessionKind } from '@was/shared';
import { useQueryClient } from '@tanstack/react-query';
import { type ReactNode, useCallback, useMemo, useState } from 'react';

import { demoStore } from '@/data/demo.store';
import { sessionQuery } from '@/data/endpoints/session.query';
import { LoginDialog } from '@/shared-ui/login-dialog.component';

import type { LoginReason } from './session.const';
import { sessionStore, useSessionKind } from './session.store';
import { SessionContext, type SessionContextValue } from './use-session.hook';

/** Provides the simulated session + login popup to the whole app. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const kind = useSessionKind();
  const session = sessionQuery.useQuery();
  const client = useQueryClient();
  const [loginReason, setLoginReason] = useState<LoginReason | null>(null);

  const requireLogin = useCallback(
    (reason: LoginReason = 'default') => {
      if (sessionStore.get() !== SessionKind.Anon) return true;
      setLoginReason(reason);
      return false;
    },
    [],
  );
  const resetDemo = useCallback(() => {
    demoStore.reset();
    void client.invalidateQueries();
  }, [client]);

  const value = useMemo<SessionContextValue>(() => {
    const user = kind === SessionKind.Anon ? null : (session.data?.user ?? null);
    return {
      kind,
      user,
      isSignedIn: kind !== SessionKind.Anon,
      isAdmin: kind === SessionKind.Admin,
      setKind: sessionStore.set,
      requireLogin,
      resetDemo,
    };
  }, [kind, session.data, requireLogin, resetDemo]);

  return (
    <SessionContext.Provider value={value}>
      {children}
      <LoginDialog
        reason={loginReason}
        onClose={() => setLoginReason(null)}
        onSimulateLogin={() => {
          sessionStore.set(SessionKind.Reader);
          setLoginReason(null);
        }}
      />
    </SessionContext.Provider>
  );
}
