import type { Messages } from '@was/shared';

import type { RANKINGS_TEXT } from './rankings.const';

export const RANKINGS_TEXT_ES: Messages<typeof RANKINGS_TEXT> = {
  list: {
    title: 'Clasificaciones',
    eyebrow: 'Calculadas por metodología, publicadas tras doble revisión',
    lead: 'Cada deporte tiene su metodología: qué cuenta, cómo se desempata y qué queda fuera. Una clasificación publicada nunca cambia; una corrección es una nueva versión.',
    emptyTitle: 'Todavía no hay clasificaciones publicadas',
    emptyText: 'Las clasificaciones aparecen aquí tras ser calculadas y aprobadas por dos curadores distintos.',
    entries: (n: number) => (n === 1 ? '1 clasificado' : `${n} clasificados`),
    published: (date: string) => `Publicada el ${date}`,
    methodology: 'Metodología',
  },
  detail: {
    breadcrumb: 'Clasificaciones',
    rank: 'Puesto',
    competitor: 'Competidor',
    score: 'Puntos',
    tied: 'empate',
    notEligible: 'Fuera de la clasificación',
    hash: 'Hash de reproducción',
    metrics: { credits: 'Créditos', worldCups: 'Mundiales', olympicGolds: 'Oros', verifiedAppearances: 'Partidos verificados', earliestYear: 'Primer título', points: 'Puntos', worldTitles: 'Títulos mundiales', golds: 'Oros', results: 'Resultados' },
    notFoundTitle: 'Clasificación no encontrada',
    notFoundText: 'Esta clasificación no existe o todavía no se ha publicado.',
    previous: 'Anteriores',
    next: 'Siguientes',
  },
};
