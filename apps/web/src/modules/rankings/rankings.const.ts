import { defineMessages } from '@was/shared';

import { RANKINGS_TEXT_EN } from './rankings.const.en';
import { RANKINGS_TEXT_ES } from './rankings.const.es';

// UI strings of the rankings pages (pt-BR source; en/es next to it).
export const RANKINGS_TEXT = {
  list: {
    title: 'Rankings',
    eyebrow: 'Calculados por metodologia, publicados após dupla revisão',
    lead: 'Cada esporte tem a sua metodologia: o que conta, como se desempata e o que fica de fora. Um ranking publicado nunca muda; uma correção vira uma nova versão.',
    emptyTitle: 'Nenhum ranking publicado ainda',
    emptyText: 'Os rankings aparecem aqui depois de calculados e aprovados por dois curadores diferentes.',
    entries: (n: number) => (n === 1 ? '1 colocado' : `${n} colocados`),
    published: (date: string) => `Publicado em ${date}`,
    methodology: 'Metodologia',
  },
  detail: {
    breadcrumb: 'Rankings',
    rank: 'Posição',
    competitor: 'Competidor',
    score: 'Pontos',
    tied: 'empate',
    notEligible: 'Fora do ranking',
    hash: 'Hash de reprodução',
    metrics: { credits: 'Créditos', worldCups: 'Copas', olympicGolds: 'Ouros', verifiedAppearances: 'Jogos verificados', earliestYear: 'Primeiro título', points: 'Pontos', worldTitles: 'Mundiais', golds: 'Ouros', results: 'Resultados' } as Record<string, string>,
    notFoundTitle: 'Ranking não encontrado',
    notFoundText: 'Este ranking não existe ou ainda não foi publicado.',
    previous: 'Anteriores',
    next: 'Próximos',
  },
};
export const RANKINGS_MESSAGES = defineMessages(RANKINGS_TEXT, { en: RANKINGS_TEXT_EN, es: RANKINGS_TEXT_ES });
