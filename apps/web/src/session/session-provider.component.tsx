import { SessionKind } from '@was/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { type ReactNode, useCallback, useMemo, useRef, useState } from 'react';

import { DATA_SOURCE } from '@/data/data-layer.const';
import { demoStore } from '@/data/demo.store';
import { sessionQuery } from '@/data/endpoints/session.query';
import { LoginDialog } from '@/shared-ui/login-dialog.component';

import { signOutOfAuth } from './auth-client';
import { ConsentDialog } from './consent-dialog.component';
import type { LoginReason } from './session.const';
import { sessionStore, useSessionKind } from './session.store';
import { SessionContext, type SessionContextValue } from './use-session.hook';

/**
 * Session of the whole app: who is browsing comes from GET /api/session (prefetched by the SSR), so a Google
 * sign-in (Better Auth cookie) and a simulated profile (dev switcher, `was_session` cookie) look the same to pages.
 * Also owns the login popup and the blocking consent dialog (pending Google sign-in).
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const storeKind = useSessionKind();
  const session = sessionQuery.useQuery();
  const client = useQueryClient();
  const router = useRouter();
  const [loginReason, setLoginReason] = useState<LoginReason | null>(null);

  const data = session.data;
  const kind = data?.kind ?? (DATA_SOURCE === 'fixtures' ? storeKind : SessionKind.Anon);
  const pending = data?.pendingConsent ?? null;
  const simulationAvailable = DATA_SOURCE === 'fixtures' || data?.simulated === true;
  const latest = useRef({ kind, pending });
  latest.current = { kind, pending };

  /** Everything personal is refetched after the identity changes (the query keys only carry the simulated kind). */
  const refreshAll = useCallback(async () => {
    await client.resetQueries();
    await router.invalidate();
  }, [client, router]);

  const requireLogin = useCallback((reason: LoginReason = 'default') => {
    if (latest.current.kind !== SessionKind.Anon) return true;
    // A pending account already sees the blocking consent dialog: it accepts there, no login popup.
    if (!latest.current.pending) setLoginReason(reason);
    return false;
  }, []);

  const signOut = useCallback(async () => {
    if (DATA_SOURCE === 'http') await signOutOfAuth().catch(() => undefined);
    sessionStore.set(SessionKind.Anon);
    await refreshAll();
  }, [refreshAll]);

  const resetDemo = useCallback(() => {
    demoStore.reset();
    void client.invalidateQueries();
  }, [client]);

  const value = useMemo<SessionContextValue>(
    () => ({
      kind,
      user: kind === SessionKind.Anon ? null : (data?.user ?? null),
      isSignedIn: kind !== SessionKind.Anon,
      isAdmin: kind === SessionKind.Admin,
      simulationAvailable,
      setKind: sessionStore.set,
      requireLogin,
      signOut,
      resetDemo,
    }),
    [kind, data, simulationAvailable, requireLogin, signOut, resetDemo],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
      <LoginDialog
        reason={loginReason}
        onClose={() => setLoginReason(null)}
        googleEnabled={data?.googleEnabled === true}
        onSimulateLogin={
          simulationAvailable
            ? () => {
                sessionStore.set(SessionKind.Reader);
                setLoginReason(null);
              }
            : null
        }
      />
      <ConsentDialog pending={pending} onAccepted={() => void refreshAll()} onDecline={signOut} />
    </SessionContext.Provider>
  );
}
