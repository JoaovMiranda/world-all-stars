import { defineMessages } from '@was/shared';

import { DOCUMENT_PAGE_TEXT_EN } from './document-page.const.en';
import { DOCUMENT_PAGE_TEXT_ES } from './document-page.const.es';

// pt-BR strings of DocumentPageLayout (legal, accessibility and "about" pages). en/es next to it.
export const DOCUMENT_PAGE_TEXT = {
  toc: 'Nesta página',
  version: (v: string) => `Versão ${v}`,
  effectiveSince: (date: string) => `Vigente desde ${date}`,
  updatedAt: (date: string) => `Atualizado em ${date}`,
  backToTop: 'Voltar ao topo',
} as const;

export const DOCUMENT_PAGE_MESSAGES = defineMessages(DOCUMENT_PAGE_TEXT, { en: DOCUMENT_PAGE_TEXT_EN, es: DOCUMENT_PAGE_TEXT_ES });
