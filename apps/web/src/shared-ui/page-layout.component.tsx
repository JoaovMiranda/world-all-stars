import type { ReactNode } from 'react';

import { Breadcrumb, type BreadcrumbItem } from './breadcrumb.component';
import { PageHeader } from './page-header.component';

interface PageLayoutProps {
  /** Text of the h1 unless `heading` is given (the <title> comes from the route head, app/head.helper.ts). */
  title: string;
  /** Rich h1 content (defaults to `title`). */
  heading?: ReactNode;
  breadcrumb?: readonly BreadcrumbItem[];
  eyebrow?: ReactNode;
  lead?: ReactNode;
  badges?: ReactNode;
  actions?: ReactNode;
  /** Extra header content (portrait, KPIs line…). */
  headerExtra?: ReactNode;
  /** Visual on the left of the header (portrait). */
  media?: ReactNode;
  /** Right column (4/12): infobox, filters. Stacks under the content below 960 px. */
  aside?: ReactNode;
  children: ReactNode;
}

/** Skeleton of every public page: breadcrumb → header → content (8/12) + optional aside (4/12). */
export function PageLayout({ title, heading, breadcrumb, eyebrow, lead, badges, actions, headerExtra, media, aside, children }: PageLayoutProps) {
  return (
    <div className="page">
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <PageHeader title={heading ?? title} eyebrow={eyebrow} lead={lead} badges={badges} actions={actions} media={media}>
        {headerExtra}
      </PageHeader>
      {aside ? (
        <div className="page-body-aside">
          <div className="stack">{children}</div>
          <aside className="stack">{aside}</aside>
        </div>
      ) : (
        <div className="stack">{children}</div>
      )}
    </div>
  );
}
