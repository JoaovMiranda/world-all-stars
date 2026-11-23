import type { Locale } from '@was/shared';
import type { ReactNode } from 'react';

import { Breadcrumb } from './breadcrumb.component';
import type { BreadcrumbItem } from './breadcrumb-item.interface';
import { useContentLang } from './content-lang.helper';
import { PageHeader } from './page-header.component';
import { UntranslatedNote } from './untranslated-note.component';

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
  /** Extra classes on the page wrapper (e.g. the athlete tier theme). */
  className?: string | undefined;
  /** Decorative layer behind the header (see PageHeader). */
  decor?: ReactNode;
  /** Language the API content came in (`contentLocale`): a discreet note when it differs from the interface. */
  contentLocale?: Locale | undefined;
  children: ReactNode;
}

/** Skeleton of every public page: breadcrumb → header → content (8/12) + optional aside (4/12). */
export function PageLayout({
  title,
  heading,
  breadcrumb,
  eyebrow,
  lead,
  badges,
  actions,
  headerExtra,
  media,
  decor,
  aside,
  contentLocale,
  className,
  children,
}: PageLayoutProps) {
  // The lead is API prose on the pages that pass contentLocale (sport description…): mark its language (WCAG 3.1.2).
  const contentLang = useContentLang(contentLocale);
  const leadNode = lead && contentLang ? <span lang={contentLang}>{lead}</span> : lead;
  return (
    <div className={className ? `page ${className}` : 'page'}>
      {breadcrumb && <Breadcrumb items={breadcrumb} />}
      <PageHeader title={heading ?? title} eyebrow={eyebrow} lead={leadNode} badges={badges} actions={actions} media={media} decor={decor}>
        {headerExtra}
      </PageHeader>
      <UntranslatedNote contentLocale={contentLocale} />
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
