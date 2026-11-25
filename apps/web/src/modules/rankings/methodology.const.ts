import { defineMessages } from '@was/shared';

import { METHODOLOGY_TEXT_EN } from './methodology.const.en';
import { METHODOLOGY_TEXT_ES } from './methodology.const.es';

// UI strings of the public methodology pages (T4.2) (pt-BR source; en/es next to it). The document itself is the
// methodology's METHODOLOGY.md, served by the API.
export const METHODOLOGY_TEXT = {
  eyebrow: 'Metodologia do ranking',
  breadcrumb: 'Rankings',
  documentTitle: (name: string) => `Metodologia: ${name}`,
  metaDescription: (name: string) => `Como o World All Stars calcula o ranking ${name}: fórmula, elegibilidade, desempates e exemplos calculados à mão.`,
  intro: 'Resumo',
  rankingsTitle: 'Rankings desta metodologia',
  rankingsLead: 'Cada ranking abaixo é publicado separadamente com esta metodologia.',
  rankingsLink: 'Ver rankings publicados',
  notFoundTitle: 'Metodologia não encontrada',
  notFoundText: 'Confira o endereço ou escolha uma metodologia na página de rankings.',
  tableCaption: (section: string) => `Tabela: ${section}`,
  // Links from the rankings pages
  link: 'Como este ranking é calculado',
  listTitle: 'Metodologias',
  listLead: 'Cada ranking segue uma metodologia pública e versionada, com exemplos que viram testes automáticos.',
};
export const METHODOLOGY_MESSAGES = defineMessages(METHODOLOGY_TEXT, { en: METHODOLOGY_TEXT_EN, es: METHODOLOGY_TEXT_ES });
