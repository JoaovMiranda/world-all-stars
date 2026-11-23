import type { LinkProps } from '@tanstack/react-router';

export interface BreadcrumbItem {
  label: string;
  /** Typed router link of the item (omit for the current page, always last). */
  link?: Pick<LinkProps, 'to' | 'params' | 'search' | 'hash'>;
}
