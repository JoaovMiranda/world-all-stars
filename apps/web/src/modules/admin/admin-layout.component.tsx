import './admin.css';

import type { AdminSection } from '@was/shared';
import type { ReactNode } from 'react';

import { useText } from '@/i18n/use-text.hook';
import { PageLayout } from '@/shared-ui/page-layout.component';
import { RequireSession } from '@/shared-ui/require-session.component';

import { ADMIN_MESSAGES } from './admin.const';
import { AdminNav } from './admin-nav.component';

interface AdminLayoutProps {
  /** Current section (undefined = Painel). */
  section?: AdminSection;
  actions?: ReactNode;
  children: ReactNode;
}

/** Shell of every admin page: header + breadcrumb, admin-only gate (sign in / 403), section nav with counters. */
export function AdminLayout({ section, actions, children }: AdminLayoutProps) {
  const adminText = useText(ADMIN_MESSAGES);
  const t = section ? adminText.sections[section] : { title: adminText.title, lead: adminText.lead };
  return (
    <PageLayout
      title={t.title}
      eyebrow={adminText.eyebrow}
      lead={t.lead}
      actions={actions}
      breadcrumb={section ? [{ label: adminText.eyebrow, link: { to: '/admin' } }, { label: t.title }] : [{ label: adminText.eyebrow }]}
    >
      <RequireSession role="admin">
        <div className="admin-shell">
          <AdminNav />
          <div className="stack admin-main">{children}</div>
        </div>
      </RequireSession>
    </PageLayout>
  );
}
