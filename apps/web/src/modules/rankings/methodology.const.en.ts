import type { Messages } from '@was/shared';

import type { METHODOLOGY_TEXT } from './methodology.const';

export const METHODOLOGY_TEXT_EN: Messages<typeof METHODOLOGY_TEXT> = {
  eyebrow: 'Ranking methodology',
  breadcrumb: 'Rankings',
  documentTitle: (name: string) => `Methodology: ${name}`,
  metaDescription: (name: string) => `How World All Stars calculates the ${name} ranking: formula, eligibility, tie-breaks and hand-computed examples.`,
  intro: 'Summary',
  rankingsTitle: 'Rankings of this methodology',
  rankingsLead: 'Each ranking below is published separately with this methodology.',
  rankingsLink: 'See published rankings',
  notFoundTitle: 'Methodology not found',
  notFoundText: 'Check the address or pick a methodology on the rankings page.',
  tableCaption: (section: string) => `Table: ${section}`,
  link: 'How this ranking is calculated',
  listTitle: 'Methodologies',
  listLead: 'Every ranking follows a public, versioned methodology, with examples that become automated tests.',
};
