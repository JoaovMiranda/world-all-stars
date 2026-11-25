import type { Messages } from '@was/shared';

import type { COMPARE_TEXT } from './compare.const';

export const COMPARE_TEXT_ES: Messages<typeof COMPARE_TEXT> = {
  page: {
    title: 'Comparar competidores',
    eyebrow: 'Cara a cara',
    lead: 'Dos competidores lado a lado: deportes, franja entre deportes, legado, títulos y medallas, puntuación de metodología (solo en el mismo deporte) y fuentes.',
    breadcrumb: 'Atletas',
    disclaimerTitle: 'Comparación aproximada',
    disclaimer:
      'Entre deportes distintos, la comparación usa solo la franja (S a D) y el legado. Las puntuaciones de metodología aparecen solo cuando ambos compiten en el mismo deporte.',
    pickerLabel: 'Elección de los competidores',
    sideA: 'Competidor A',
    sideB: 'Competidor B',
    choose: 'Elige un competidor',
    swap: 'Intercambiar lados',
    pickHint: 'Elige dos competidores para verlos lado a lado.',
    sameHint: 'Elige dos competidores distintos.',
    shareHint: 'La dirección de esta página guarda tu elección: cópiala para compartir la comparación.',
    notFoundTitle: 'Competidor no encontrado',
    notFoundText: 'Uno de los competidores elegidos no existe o no tiene perfil público. Elige otro.',
  },
  table: {
    caption: (a: string, b: string) => `Comparación entre ${a} y ${b}`,
    criterion: 'Criterio',
    sports: 'Deportes',
    band: 'Franja entre deportes',
    bandItems: 'Elementos aceptados de la franja',
    legacy: 'Nivel de legado',
    titles: 'Títulos y medallas',
    sources: 'Fuentes',
    noBand: 'Sin franja',
    none: 'Ninguno',
    count: (label: string, n: number) => `${label}: ${n}`,
    pending: (n: number) => (n === 1 ? '1 logro pendiente de revisión' : `${n} logros pendientes de revisión`),
    legacyScore: (n: string) => `${n} puntos de legado`,
  },
  methodology: {
    title: 'Puntuación de la metodología',
    lead: (sports: string) => `Rankings publicados de ${sports}, el deporte en común.`,
    crossSport: 'Compiten en deportes distintos: las puntuaciones de metodología no se comparan. Usa la franja entre deportes de arriba.',
    empty: 'Ningún ranking publicado del deporte en común incluye a estos competidores todavía.',
    caption: 'Posición y puntuación en cada ranking publicado del deporte en común',
    ranking: 'Ranking',
    position: (rank: number, tied: boolean) => `${tied ? '=' : ''}${rank}.º`,
    score: (n: string) => `${n} pts`,
    notRanked: 'Fuera del ranking',
  },
  footer: {
    rulesets: (band: string, legacy: string) => `Reglas: ${band} · ${legacy}`,
    bandsMethodology: 'Cómo se calculan las franjas',
  },
  profileLink: 'Comparar con otro competidor',
};
