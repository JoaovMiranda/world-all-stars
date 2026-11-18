import type { Messages } from '@was/shared';

import type { HALL_OF_GREATS_TEXT } from './hall-of-greats.const';

export const HALL_OF_GREATS_TEXT_ES = {
  page: {
    title: 'Hall of Greats',
    heading: 'Los que cambiaron el juego',
    eyebrow: 'Hall of Greats',
    lead: 'No basta con ganarlo todo: para entrar en el Hall, el campeón tiene que haber cambiado su propio deporte. Cada nombre tiene un dossier público con evidencias y fuentes.',
  },
  rules: {
    label: 'Reglas de entrada',
    items: [
      { title: '1. Nivel Mítico', text: 'Solo atletas clasificados como Míticos. El nivel nunca es automático.' },
      { title: '2. Dossier «Cambió el juego»', text: 'Al menos 2 evidencias (récord histórico, técnica, cambio de regla, popularización, reconocimiento), cada una con su fuente.' },
      { title: '3. Doble aprobación', text: 'Dos admins aprueban el dossier. Todo queda versionado.' },
    ],
  },
  legends: {
    label: 'Los Míticos del Hall',
    evidences: (n) => (n === 1 ? '1 evidencia' : `${n} evidencias`),
    approvals: (n) => (n === 1 ? '1 aprobación' : `${n} aprobaciones`),
    emptyTitle: 'Todavía no hay Míticos en el Hall',
    emptyText: 'El Hall solo admite atletas Míticos con dossier aprobado por dos admins. Los primeros nombres aparecerán aquí en cuanto sean consagrados.',
    emptyAction: 'Cómo alguien se vuelve Mítico',
  },
  queue: {
    title: 'En la cola: Legendarios sin dossier',
    eyebrow: 'el equipo de curaduría prepara el dossier',
    emptyTitle: 'Nadie en la cola',
    emptyText: 'Cuando un Legendario sea propuesto para el Hall, aparecerá aquí mientras el equipo de curaduría prepara el dossier.',
  },
} satisfies Messages<typeof HALL_OF_GREATS_TEXT>;
