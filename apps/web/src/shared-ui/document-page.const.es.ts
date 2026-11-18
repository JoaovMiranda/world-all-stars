import type { Messages } from '@was/shared';

import type { DOCUMENT_PAGE_TEXT } from './document-page.const';

export const DOCUMENT_PAGE_TEXT_ES = {
  toc: 'En esta página',
  version: (v) => `Versión ${v}`,
  effectiveSince: (date) => `Vigente desde el ${date}`,
  updatedAt: (date) => `Actualizado el ${date}`,
  backToTop: 'Volver arriba',
} satisfies Messages<typeof DOCUMENT_PAGE_TEXT>;
