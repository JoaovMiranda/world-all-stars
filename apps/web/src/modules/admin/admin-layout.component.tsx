import './admin.css';

import type { AdminSection } from '@was/shared';
import type { ReactNode } from 'react';

import { PageLayout } from '@/shared-ui/page-layout.component';
import { RequireSession } from '@/shared-ui/require-session.component';

import { ADMIN_TEXT } from './admin.const';
import { AdminNav } from './admin-nav.component';

interface AdminLayoutProps {
  /** Current section (undefined = Painel). */
  section?: AdminSection;
  actions?: ReactNode;
  children: ReactNode;
}

/** Shell of every admin page: header + breadcrumb, admin-only gate (sign in / 403), section nav with counters. */
export function AdminLayout({ section, actions, children }: AdminLayoutProps) {
  const t = section ? ADMIN_TEXT.sections[section] : { title: ADMIN_TEXT.title, lead: ADMIN_TEXT.lead };
  return (
    <PageLayout
      title={t.title}
      eyebrow={ADMIN_TEXT.eyebrow}
      lead={t.lead}
      actions={actions}
      breadcrumb={section ? [{ label: ADMIN_TEXT.eyebrow, link: { to: '/admin' } }, { label: t.title }] : [{ label: ADMIN_TEXT.eyebrow }]}
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
