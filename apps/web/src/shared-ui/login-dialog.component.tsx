import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { signInWithGoogle } from '@/session/auth-client';
import type { LoginReason } from '@/session/login-reason.type';
import { SESSION_MESSAGES } from '@/session/session.const';
import { Button } from './button.component';
import { Dialog } from './dialog.component';
import { GoogleButton } from './google-button.component';
import { Notice } from './notice.component';

interface LoginDialogProps {
  /** Open when not null; the reason completes the title ("Sign in to vote…"). */
  reason: LoginReason | null;
  onClose: () => void;
  /** Google configured on the server (GET /api/session `googleEnabled`). */
  googleEnabled: boolean;
  /** Dev switcher available (fixtures or AUTH_SIMULATED): shows "Simular entrada". */
  onSimulateLogin: (() => void) | null;
}

/** Sign-in (doc 20, E1): Google only. Returns to the same page after Google's callback. */
export function LoginDialog({ reason, onClose, googleEnabled, onSimulateLogin }: LoginDialogProps) {
  const t = useText(SESSION_MESSAGES);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const google = async () => {
    setBusy(true);
    setError(false);
    try {
      await signInWithGoogle(window.location.href);
    } catch {
      setError(true);
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={reason !== null}
      onClose={onClose}
      kicker={t.loginKicker}
      title={t.loginTitle(t.reasons[reason ?? 'default'])}
      actions={
        <Button variant="ghost" onClick={onClose}>
          {t.loginCancel}
        </Button>
      }
    >
      <div className="login-stack">
        <p className="muted">{t.loginText}</p>
        <GoogleButton label={googleEnabled ? t.loginGoogle : t.loginGoogleUnavailable} onClick={() => void google()} disabled={!googleEnabled} busy={busy} />
        {!googleEnabled && <p className="login-legal">{t.loginGoogleUnavailableHint}</p>}
        {error && (
          <Notice tone="danger" live="assertive">
            {t.loginGoogleError}
          </Notice>
        )}
        <p className="login-legal">
          {t.loginLegal.before}{' '}
          <Link to="/legal/terms" onClick={onClose}>
            {t.loginLegal.terms}
          </Link>{' '}
          {t.loginLegal.and}{' '}
          <Link to="/legal/privacy" onClick={onClose}>
            {t.loginLegal.privacy}
          </Link>
          {t.loginLegal.after}
        </p>
        {onSimulateLogin && (
          <div className="login-dev">
            <p className="login-legal">{t.loginSimulateHint}</p>
            <Button variant="secondary" onClick={onSimulateLogin}>
              {t.loginConfirm}
            </Button>
          </div>
        )}
      </div>
    </Dialog>
  );
}
