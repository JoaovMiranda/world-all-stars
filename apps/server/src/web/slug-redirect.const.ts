import { athletes, sports } from '@was/db';

import type { SluggedTable } from './slugged-table.type';

/** Entity pages that redirect old slugs: URL prefix, table of the current slugs, slug_redirects entity type. */
export const SLUG_REDIRECT_PAGES: { prefix: string; table: SluggedTable; entityType: 'sport' | 'competitor' }[] = [
  { prefix: '/sports/', table: sports, entityType: 'sport' },
  { prefix: '/athletes/', table: athletes, entityType: 'competitor' },
];
