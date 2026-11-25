import type { Messages } from '@was/shared';

import type { METHODOLOGY_TEXT } from './methodology.const';

export const METHODOLOGY_TEXT_ES: Messages<typeof METHODOLOGY_TEXT> = {
  eyebrow: 'Metodología del ranking',
  breadcrumb: 'Rankings',
  documentTitle: (name: string) => `Metodología: ${name}`,
  metaDescription: (name: string) => `Cómo World All Stars calcula el ranking ${name}: fórmula, elegibilidad, desempates y ejemplos calculados a mano.`,
  intro: 'Resumen',
  rankingsTitle: 'Rankings de esta metodología',
  rankingsLead: 'Cada ranking de abajo se publica por separado con esta metodología.',
  rankingsLink: 'Ver rankings publicados',
  notFoundTitle: 'Metodología no encontrada',
  notFoundText: 'Revisa la dirección o elige una metodología en la página de rankings.',
  tableCaption: (section: string) => `Tabla: ${section}`,
  link: 'Cómo se calcula este ranking',
  listTitle: 'Metodologías',
  listLead: 'Cada ranking sigue una metodología pública y versionada, con ejemplos que se convierten en pruebas automáticas.',
};
