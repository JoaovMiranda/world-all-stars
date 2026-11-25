import { defineMessages } from '@was/shared';

import { CROSS_SPORT_TEXT_EN } from './cross-sport.const.en';
import { CROSS_SPORT_TEXT_ES } from './cross-sport.const.es';

// UI strings of the cross-sport bands (D07) and legacy levels (D11) (pt-BR source; en/es next to it).
export const CROSS_SPORT_TEXT = {
  page: {
    title: 'Todos os esportes',
    eyebrow: 'Faixas entre esportes, de S a D',
    lead: 'Competidores de esportes diferentes agrupados pela faixa das suas conquistas aceitas. Dentro de cada faixa, a ordem segue a soma de pontos, sem teto.',
    breadcrumb: 'Rankings',
    disclaimerTitle: 'Comparação aproximada',
    disclaimer:
      'Esportes têm calendários, formatos e níveis de concorrência diferentes. As faixas são uma leitura aproximada e versionada para orientar a navegação; não dizem que um esporte, ou um atleta, é melhor do que outro.',
    methodologyLink: 'Como as faixas são calculadas',
    filtersLabel: 'Filtros da lista por faixa',
    sport: 'Esporte',
    allSports: 'Todos os esportes',
    gender: 'Gênero',
    allGenders: 'Todos',
    genders: { male: 'Masculino', female: 'Feminino' } as Record<string, string>,
    era: 'Época',
    allEras: 'Todas as épocas',
    eras: { 'until-1949': 'Até 1949', '1950-1969': '1950–1969', '1970-1989': '1970–1989', '1990-2009': '1990–2009', 'since-2010': 'Desde 2010' } as Record<
      string,
      string
    >,
    bandHeading: (band: string) => `Faixa ${band}`,
    bandCount: (n: number) => (n === 1 ? '1 competidor' : `${n} competidores`),
    emptyBand: 'Nenhum competidor nesta faixa com os filtros atuais.',
    emptyTitle: 'Nenhuma faixa calculada ainda',
    emptyText: 'As faixas aparecem quando há conquistas publicadas com mapeamento revisado.',
    accepted: 'Itens aceitos',
    pending: (n: number) => (n === 1 ? '1 conquista aguardando revisão de mapeamento' : `${n} conquistas aguardando revisão de mapeamento`),
    unmappedNote: (n: number) =>
      n === 1
        ? '1 conquista ainda não tem mapeamento e não entra na conta (fica em revisão, nunca vale zero).'
        : `${n} conquistas ainda não têm mapeamento e não entram na conta (ficam em revisão, nunca valem zero).`,
    hash: 'Hash de reprodução',
    ruleset: 'Regras',
  },
  bands: {
    names: { S: 'Topo do esporte', A: 'Grande título', B: 'Título relevante', C: 'Resultado notável', D: 'Destaque' } as Record<string, string>,
    letter: (band: string) => `Faixa ${band}`,
    points: (n: string) => `${n} pts`,
    pointsLong: (n: string) => `${n} pontos`,
  },
  methodology: {
    title: 'Metodologia das faixas entre esportes',
    lead: 'Como uma conquista publicada vira uma faixa de S a D, de onde vêm os mapeamentos e o que esta comparação não diz.',
    bandsTitle: 'Faixas e pontos',
    bandsLead: 'Cada conquista aceita vale os pontos da sua faixa. Os pontos se somam sem teto; a faixa do competidor é a mais alta que ele alcançou.',
    band: 'Faixa',
    meaning: 'Significado',
    points: 'Pontos',
    howTitle: 'Como funciona',
    how: [
      'Só entram conquistas publicadas de perfis públicos: títulos, cinturões, medalhas e vice-campeonatos.',
      'Cada esporte tem a sua tabela de mapeamento (dados versionados, com nota de origem): competição ou organização → faixa.',
      'Medalhas olímpicas de qualquer modalidade usam a mesma regra: ouro S, prata A, bronze B.',
      'Uma conquista sem mapeamento vai para a fila de revisão da curadoria. Ela não é adivinhada nem conta como zero.',
      'Hall da fama, prêmios individuais e títulos honoríficos (como Bola de Ouro ou título de GM) contam só para o legado, nunca para a faixa.',
    ],
    sourcesTitle: 'Fontes',
    sourcesText:
      'As conquistas vêm das mesmas fontes públicas dos perfis (Wikipedia, Wikidata e as organizações de cada esporte), com a procedência registrada em cada item.',
    limitsTitle: 'Limites',
    limits: [
      'É uma comparação aproximada: não mede dificuldade, concorrência nem época de forma exata.',
      'Esportes com mais competições publicadas acumulam mais pontos; compare faixas, não só pontos.',
      'Esportes ainda sem mapeamento revisado não aparecem até a curadoria revisar as suas conquistas.',
    ],
    olympicSport: 'Medalhas olímpicas (todas as modalidades)',
    mappingsTitle: 'Mapeamentos por esporte',
    mappingsLead: 'Cada tabela tem a sua própria versão (hash). Mudar um mapeamento muda só o hash daquele esporte e gera um novo cálculo.',
    kind: 'Tipo',
    value: 'Competição ou resultado',
    period: 'Período',
    anyPeriod: 'Qualquer época',
    note: 'Origem',
    kinds: { recognition: 'Título', result: 'Resultado' } as Record<string, string>,
    reproducibilityTitle: 'Reprodutibilidade',
    reproducibilityText: 'Os mesmos dados publicados e os mesmos mapeamentos sempre geram o mesmo hash de saída. Filtros não alteram o cálculo.',
    inputHash: 'Hash de entrada',
    outputHash: 'Hash de saída',
    competitors: (n: number) => (n === 1 ? '1 competidor com faixa' : `${n} competidores com faixa`),
    unmapped: (n: number) => (n === 1 ? '1 conquista em revisão' : `${n} conquistas em revisão`),
    backToList: 'Ver a lista por faixa',
  },
  readout: {
    title: 'Faixa entre esportes',
    none: 'Nenhuma conquista mapeada para as faixas entre esportes ainda.',
    summary: (band: string, points: string) => `Faixa ${band} · ${points} pontos`,
    note: 'Leitura aproximada entre esportes, separada da pontuação de cada ranking e do legado.',
    methodologyLink: 'Metodologia das faixas',
    allSportsLink: 'Ver todos os esportes',
  },
  legacy: {
    title: 'Nível de legado',
    levels: { L0: 'Sem nível', L1: 'L1 · Reconhecido', L2: 'L2 · Destacado', L3: 'L3 · Consagrado', L4: 'L4 · Histórico', L5: 'L5 · Fundador' } as Record<
      string,
      string
    >,
    meaning: {
      L0: 'Ainda não há honraria aceita pelas regras de legado.',
      L1: 'Tem honrarias reconhecidas no seu esporte.',
      L2: 'Um conjunto consistente de honrarias de peso.',
      L3: 'Uma carreira consagrada, com honrarias em vários níveis.',
      L4: 'Uma das trajetórias históricas do esporte.',
      L5: 'Fundador: mudou o esporte. Exige um dossiê aprovado no Hall of Greats.',
    } as Record<string, string>,
    score: (n: string) => `Pontuação de legado: ${n}`,
    separate: 'O legado é uma leitura separada: nunca altera pontos competitivos, posições em rankings nem faixas entre esportes.',
    l5Gate: 'O nível L5 só é concedido com dossiê aprovado no Hall of Greats; a pontuação sozinha nunca basta.',
    dossier: { approved: 'Dossiê aprovado', pending: 'Dossiê em análise', draft: 'Dossiê em rascunho', rejected: 'Dossiê recusado' } as Record<string, string>,
    noDossier: 'Sem dossiê no Hall of Greats',
    aboveThreshold: 'Pontuação acima do limite do L5, mas sem dossiê aprovado.',
    accepted: 'Honrarias aceitas',
    excluded: 'Fora da conta',
    honors: {
      world_champion: 'Título mundial',
      continental_champion: 'Título continental',
      national_champion: 'Título nacional',
      award: 'Prêmio',
      record: 'Recorde',
      hall_of_fame: 'Hall da fama',
    } as Record<string, string>,
    reasons: { 'not verified': 'não verificado', 'not a legacy honor': 'não conta para o legado' } as Record<string, string>,
    points: (n: number) => `+${n}`,
    showDetails: 'Ver honrarias',
  },
};
export const CROSS_SPORT_MESSAGES = defineMessages(CROSS_SPORT_TEXT, { en: CROSS_SPORT_TEXT_EN, es: CROSS_SPORT_TEXT_ES });
