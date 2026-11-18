import { API_ERROR_MESSAGES, ApiErrorCode, SessionKind } from '@was/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { DATA_SOURCE } from '@/data/data-layer.const';
import { demoStore } from '@/data/demo.store';
import { sessionQuery } from '@/data/endpoints/session.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { Dialog } from '@/shared-ui/dialog.component';
import { LoginDialog } from '@/shared-ui/login-dialog.component';

import { signOutOfAuth } from './auth-client';
import { ConsentDialog } from './consent-dialog.component';
import { AUTH_ERROR_PARAMS, type LoginReason, SESSION_MESSAGES } from './session.const';
import { sessionIdentity } from './session-identity.helper';
import { identityStore, sessionStore, useSessionKind } from './session.store';
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
  const [signInError, setSignInError] = useState<string | null>(null);
  const t = useText(SESSION_MESSAGES);
  const apiText = useText(API_ERROR_MESSAGES);

  // A refused Google sign-in comes back as `?error=<code>` (Better Auth's errorCallbackURL; `banned` from our
  // session hook). Shown once from our own catalog (never the URL's description), then removed from the URL.
  useEffect(() => {
    const url = new URL(window.location.href);
    const code = url.searchParams.get(AUTH_ERROR_PARAMS[0]);
    if (!code) return;
    setSignInError(code);
    for (const param of AUTH_ERROR_PARAMS) url.searchParams.delete(param);
    router.history.replace(`${url.pathname}${url.search}${url.hash}`);
  }, [router]);

  const data = session.data;
  const kind = data?.kind ?? (DATA_SOURCE === 'fixtures' ? storeKind : SessionKind.Anon);
  const pending = data?.pendingConsent ?? null;
  const simulationAvailable = DATA_SOURCE === 'fixtures' || data?.simulated === true;
  const latest = useRef({ kind, pending });
  latest.current = { kind, pending };

  // The identity (kind + account) is part of every personalized query key: when the session answer names another
  // account, pages switch to keys of that account (fetched fresh) and the previous account's answers are dropped.
  const identity = session.data ? sessionIdentity(session.data) : null;
  useEffect(() => {
    if (identity === null) return;
    const previous = identityStore.get();
    if (identity === previous) return;
    identityStore.set(identity);
    client.removeQueries({ predicate: (q) => q.queryKey.includes(previous) });
  }, [identity, client]);

  /** After a sign-out or a consent: asks the API who is browsing again (the identity effect does the rest). */
  const refreshAll = useCallback(async () => {
    await client.invalidateQueries({ queryKey: sessionQuery.baseKey });
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
      <Dialog
        open={signInError !== null}
        onClose={() => setSignInError(null)}
        kicker={t.loginKicker}
        title={t.signInFailedTitle}
        actions={<Button onClick={() => setSignInError(null)}>{t.signInFailedClose}</Button>}
      >
        <p>{signInError === ApiErrorCode.Banned ? apiText.banned : t.signInFailed}</p>
      </Dialog>
      <ConsentDialog pending={pending} onAccepted={() => void refreshAll()} onDecline={signOut} />
    </SessionContext.Provider>
  );
}
