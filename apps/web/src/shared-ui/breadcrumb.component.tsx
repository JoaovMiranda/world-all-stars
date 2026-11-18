import { Link, type LinkProps } from '@tanstack/react-router';
import { Fragment } from 'react';

import { useText } from '@/i18n/use-text.hook';

import { UI_MESSAGES } from './ui-text.const';

export interface BreadcrumbItem {
  label: string;
  /** Typed router link of the item (omit for the current page, always last). */
  link?: Pick<LinkProps, 'to' | 'params' | 'search' | 'hash'>;
}

/** "Início › Atletas › Pelé" trail (nav landmark; the home is implicit and always first). */
export function Breadcrumb({ items }: { items: readonly BreadcrumbItem[] }) {
  const ui = useText(UI_MESSAGES);
  return (
    <nav className="breadcrumb" aria-label={ui.breadcrumbLabel}>
      <Link to="/">{ui.home}</Link>
      {items.map((item, i) => (
        <Fragment key={`${item.label}-${i}`}>
          <span aria-hidden="true">›</span>
          {item.link && i < items.length - 1 ? <Link {...(item.link as LinkProps)}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}
