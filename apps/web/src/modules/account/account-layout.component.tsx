import './account.css';

import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { PageLayout } from '@/shared-ui/page-layout.component';
import { RequireSession } from '@/shared-ui/require-session.component';

import { ACCOUNT_TEXT } from './account.const';

const NAV = [
  { to: '/me', label: ACCOUNT_TEXT.nav.me },
  { to: '/me/notifications', label: ACCOUNT_TEXT.nav.notifications },
  { to: '/me/data', label: ACCOUNT_TEXT.nav.data },
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
  return (
    <PageLayout title={title} eyebrow={ACCOUNT_TEXT.eyebrow} lead={lead} actions={actions} breadcrumb={[{ label: ACCOUNT_TEXT.eyebrow, link: { to: '/me' } }, { label: title }]}>
      <nav className="account-nav" aria-label={ACCOUNT_TEXT.navLabel}>
        {NAV.map((item) => (
          <Link key={item.to} to={item.to} activeOptions={{ exact: true, includeSearch: false }} activeProps={{ 'aria-current': 'page' }}>
            {item.label}
          </Link>
        ))}
      </nav>
      {skipGate ? children : <RequireSession>{children}</RequireSession>}
    </PageLayout>
  );
}
