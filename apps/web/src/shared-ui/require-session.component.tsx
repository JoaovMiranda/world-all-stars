import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import type { LoginReason } from '@/session/session.const';
import { useSession } from '@/session/use-session.hook';

import { Button } from './button.component';
import { EmptyState } from './empty-state.component';
import { UI_MESSAGES } from './ui-text.const';

interface RequireSessionProps {
  /** reader = any account; admin = curators only. */
  role?: 'reader' | 'admin';
  reason?: LoginReason;
  children: ReactNode;
}

/** Gate for account/admin pages: shows a sign-in prompt (or admin-only notice) instead of the content. */
export function RequireSession({ role = 'reader', reason = 'account', children }: RequireSessionProps) {
  const ui = useText(UI_MESSAGES);
  const { isSignedIn, isAdmin, requireLogin } = useSession();
  if (!isSignedIn) {
    return (
      <EmptyState title={ui.signInTitle} action={<Button variant="primary" onClick={() => requireLogin(reason)}>{ui.signInAction}</Button>}>
        {ui.signInText}
      </EmptyState>
    );
  }
  if (role === 'admin' && !isAdmin) return <EmptyState title={ui.adminOnlyTitle} mark="◆">{ui.adminOnlyText}</EmptyState>;
  return <>{children}</>;
}
