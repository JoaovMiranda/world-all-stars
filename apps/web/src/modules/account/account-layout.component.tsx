import './account.css';

import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { RequireSession } from '@/shared-ui/require-session.component';

import { ACCOUNT_MESSAGES } from './account.const';

const NAV = [
  { to: '/me', key: 'me' },
  { to: '/me/notifications', key: 'notifications' },
  { to: '/me/data', key: 'data' },
] as const;

interface AccountLayoutProps {
  title: string;
  lead: string;
  actions?: ReactNode;
  /** Render the children even without a session (e.g. "account deleted" confirmation). */
  skipGate?: boolean;
  children: ReactNode;
}

/** Shell of the account pages: header, sub-navigation and the sign-in gate (anon sees the login prompt). */
export function AccountLayout({ title, lead, actions, skipGate = false, children }: AccountLayoutProps) {
  const accountText = useText(ACCOUNT_MESSAGES);
  return (
    <PageLayout title={title} eyebrow={accountText.eyebrow} lead={lead} actions={actions} breadcrumb={[{ label: accountText.eyebrow, link: { to: '/me' } }, { label: title }]}>
      <nav className="account-nav" aria-label={accountText.navLabel}>
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} activeOptions={{ exact: true, includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
            {accountText.nav[item.key]}
          </Link>
        ))}
      </nav>
      {skipGate ? children : <RequireSession>{children}</RequireSession>}
    </PageLayout>
  );
}
