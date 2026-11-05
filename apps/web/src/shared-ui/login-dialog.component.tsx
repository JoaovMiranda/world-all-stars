import { SESSION_TEXT, type LoginReason } from '@/session/session.const';

import { Button } from './button.component';
import { Dialog } from './dialog.component';

interface LoginDialogProps {
  /** Open when not null; the reason completes the title ("Entre para votar…"). */
  reason: LoginReason | null;
  onClose: () => void;
  onSimulateLogin: () => void;
}

/** E1 placeholder (docs 09/20): the real sign-in (e-mail, OAuth, terms, 18+) will be designed later. */
export function LoginDialog({ reason, onClose, onSimulateLogin }: LoginDialogProps) {
  return (
    <Dialog
      open={reason !== null}
      onClose={onClose}
      kicker={SESSION_TEXT.loginKicker}
      title={SESSION_TEXT.loginTitle(SESSION_TEXT.reasons[reason ?? 'default'])}
      actions={
        <>
          <Button variant="ghost" onClick={onClose}>
            {SESSION_TEXT.loginCancel}
          </Button>
          <Button variant="primary" onClick={onSimulateLogin}>
            {SESSION_TEXT.loginConfirm}
          </Button>
        </>
      }
    >
      <p className="muted">{SESSION_TEXT.loginText}</p>
    </Dialog>
  );
}
