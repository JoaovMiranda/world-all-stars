import type { Messages } from '@was/shared';

import type { ADMIN_CROSS_SPORT_TEXT } from './admin-cross-sport.const';

export const ADMIN_CROSS_SPORT_TEXT_ES: Messages<typeof ADMIN_CROSS_SPORT_TEXT> = {
  title: 'Franjas: logros sin mapeo',
  lead: 'Logros competitivos publicados que aún no tienen fila de mapeo en el conjunto de reglas. Quedan fuera de la franja (nunca valen cero ni se adivinan) hasta que la curaduría cree el mapeo.',
  navGroup: 'Franjas entre deportes',
  navLink: 'Sin mapeo',
  caption: 'Logros sin mapeo',
  competitor: 'Competidor',
  sport: 'Deporte',
  kind: 'Tipo',
  value: 'Valor por mapear',
  achievement: 'Logro',
  year: 'Año',
  kinds: { recognition: 'Campeonato', result: 'Resultado' },
  total: (n: number) => (n === 1 ? '1 logro en revisión' : `${n} logros en revisión`),
  emptyTitle: 'Nada que revisar',
  emptyText: 'Todo logro competitivo publicado tiene mapeo.',
  methodologyLink: 'Ver la metodología y los mapeos actuales',
};
