import type { ReactNode } from 'react';

import { ButtonLink } from './button-link.component';
import type { BreadcrumbItem } from './breadcrumb.component';
import { EmptyState } from './empty-state.component';
import { PageLayout } from './page-layout.component';
import { RequireSession } from './require-session.component';
import { UI_TEXT } from './ui-text.const';

interface StubPageProps {
  title: string;
  eyebrow?: string;
  lead?: ReactNode;
  breadcrumb?: readonly BreadcrumbItem[];
  /** Extra content under the notice (e.g. the endpoints this page will use). */
  children?: ReactNode;
  /** Account (reader) or admin page: the header stays, the body asks to sign in / switch to admin. */
  gate?: 'reader' | 'admin';
}

/** Route placeholder for phase 2: real layout + "Em construção". Replace the page body, keep the route. */
export function StubPage({ title, eyebrow, lead, breadcrumb = [{ label: title }], children, gate }: StubPageProps) {
  const body = (
    <>
      <EmptyState title={UI_TEXT.underConstructionTitle} mark="◇" action={<ButtonLink to="/">{UI_TEXT.backHome}</ButtonLink>}>
        <p>{UI_TEXT.underConstructionText}</p>
      </EmptyState>
      {children}
    </>
  );
  return (
    <PageLayout title={title} eyebrow={eyebrow} lead={lead} breadcrumb={breadcrumb}>
      {gate ? <RequireSession role={gate}>{body}</RequireSession> : body}
    </PageLayout>
  );
}
