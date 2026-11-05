import type { ReactNode } from 'react';

import type { LoginReason } from '@/session/session.const';
import { useSession } from '@/session/use-session.hook';

import { Button } from './button.component';
import { EmptyState } from './empty-state.component';
import { UI_TEXT } from './ui-text.const';

interface RequireSessionProps {
  /** reader = any account; admin = curators only. */
  role?: 'reader' | 'admin';
  reason?: LoginReason;
  children: ReactNode;
}

/** Gate for account/admin pages: shows a sign-in prompt (or admin-only notice) instead of the content. */
export function RequireSession({ role = 'reader', reason = 'account', children }: RequireSessionProps) {
  const { isSignedIn, isAdmin, requireLogin } = useSession();
  if (!isSignedIn) {
    return (
      <EmptyState title={UI_TEXT.signInTitle} action={<Button variant="primary" onClick={() => requireLogin(reason)}>{UI_TEXT.signInAction}</Button>}>
        {UI_TEXT.signInText}
      </EmptyState>
    );
  }
  if (role === 'admin' && !isAdmin) return <EmptyState title={UI_TEXT.adminOnlyTitle} mark="◆">{UI_TEXT.adminOnlyText}</EmptyState>;
  return <>{children}</>;
}
