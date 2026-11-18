import type { Messages } from '@was/shared';

import type { DOCUMENT_PAGE_TEXT } from './document-page.const';

export const DOCUMENT_PAGE_TEXT_EN = {
  toc: 'On this page',
  version: (v) => `Version ${v}`,
  effectiveSince: (date) => `In effect since ${date}`,
  updatedAt: (date) => `Updated on ${date}`,
  backToTop: 'Back to top',
} satisfies Messages<typeof DOCUMENT_PAGE_TEXT>;
