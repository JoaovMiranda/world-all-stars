import { defineMessages } from '@was/shared';

import { COMPARE_TEXT_EN } from './compare.const.en';
import { COMPARE_TEXT_ES } from './compare.const.es';

// UI strings of Compare / head-to-head (D04) (pt-BR source; en/es next to it).
export const COMPARE_TEXT = {
  page: {
    title: 'Comparar competidores',
    eyebrow: 'Frente a frente',
    lead: 'Dois competidores lado a lado: esportes, faixa entre esportes, legado, títulos e medalhas, pontuação de metodologia (só no mesmo esporte) e fontes.',
    breadcrumb: 'Atletas',
    disclaimerTitle: 'Comparação aproximada',
    disclaimer:
      'Entre esportes diferentes, a comparação usa só a faixa (S a D) e o legado. Pontuações de metodologia aparecem apenas quando os dois disputam o mesmo esporte.',
    pickerLabel: 'Escolha dos competidores',
    sideA: 'Competidor A',
    sideB: 'Competidor B',
    choose: 'Escolha um competidor',
    swap: 'Trocar lados',
    pickHint: 'Escolha dois competidores para ver a comparação lado a lado.',
    sameHint: 'Escolha dois competidores diferentes.',
    shareHint: 'O endereço desta página guarda a escolha: copie-o para compartilhar a comparação.',
    notFoundTitle: 'Competidor não encontrado',
    notFoundText: 'Um dos competidores escolhidos não existe ou não tem perfil público. Escolha outro.',
  },
  table: {
    caption: (a: string, b: string) => `Comparação entre ${a} e ${b}`,
    criterion: 'Critério',
    sports: 'Esportes',
    band: 'Faixa entre esportes',
    bandItems: 'Itens aceitos da faixa',
    legacy: 'Nível de legado',
    titles: 'Títulos e medalhas',
    sources: 'Fontes',
    noBand: 'Sem faixa',
    none: 'Nenhum',
    count: (label: string, n: number) => `${label}: ${n}`,
    pending: (n: number) => (n === 1 ? '1 conquista aguardando revisão' : `${n} conquistas aguardando revisão`),
    legacyScore: (n: string) => `${n} pontos de legado`,
  },
  methodology: {
    title: 'Pontuação da metodologia',
    lead: (sports: string) => `Rankings publicados de ${sports}, o esporte em comum.`,
    crossSport: 'Os dois competem em esportes diferentes: pontuações de metodologia não são comparadas. Use a faixa entre esportes acima.',
    empty: 'Nenhum ranking publicado do esporte em comum inclui estes competidores ainda.',
    caption: 'Posição e pontuação em cada ranking publicado do esporte em comum',
    ranking: 'Ranking',
    position: (rank: number, tied: boolean) => `${tied ? '=' : ''}${rank}º`,
    score: (n: string) => `${n} pts`,
    notRanked: 'Fora do ranking',
  },
  footer: {
    rulesets: (band: string, legacy: string) => `Regras: ${band} · ${legacy}`,
    bandsMethodology: 'Como as faixas são calculadas',
  },
  /** Link from the athlete profile. */
  profileLink: 'Comparar com outro competidor',
};

export const COMPARE_MESSAGES = defineMessages(COMPARE_TEXT, { en: COMPARE_TEXT_EN, es: COMPARE_TEXT_ES });
