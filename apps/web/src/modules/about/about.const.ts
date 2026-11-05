import { COMPETITION_LEVEL_WEIGHT, MYTHIC_MIN_EVIDENCES, TIER_PERCENTILE_THRESHOLD, type CompetitionLevel, type Tier } from '@was/shared';

import type { DocumentContent } from '@/shared-ui/document-page-layout.component';

// UI strings and contents of the about module (pt-BR, ready to become an i18n namespace). Source: plan/docs/00, 17.

export const ABOUT_TEXT = {
  updatedAt: '2026-11-04',
  tiersCaption: 'Níveis de campeão: selo e definição',
  levelsHeaders: ['Nível', 'Peso no legacy score', 'Exemplos'],
  levelsCaption: 'Níveis de campeonato e prêmio, com peso e exemplos',
  actions: {
    hall: 'Ver o Hall of Greats',
    athletes: 'Ver todos os atletas',
    sources: 'De onde vêm os dados',
    suggest: 'Sugerir um atleta',
  },
} as const;

/** Definition of each tier (doc 00 "Níveis de campeão"). */
export const TIER_DEFINITION: Record<Tier, string> = {
  mythic:
    'Mudou o esporte: redefiniu técnica, recordes, popularidade ou a forma como o esporte é jogado e visto, e é referência histórica unânime. Entra no Hall of Greats.',
  legendary: 'Domínio prolongado e números históricos entre os maiores de todos os tempos, sem (ou com menos consenso sobre) ter transformado o esporte.',
  elite: 'Vários títulos de nível mundial ou continental e destaque claro na sua geração.',
  champion: 'Cumpre os critérios de inclusão do esporte (título relevante), sem domínio prolongado.',
};

/** Examples of each competition level (doc 00 "Nível de campeonato e prêmio"). */
export const LEVEL_EXAMPLES: Record<CompetitionLevel, string> = {
  world: 'Copa do Mundo FIFA, Jogos Olímpicos, Mundial de Natação, Mundial de Xadrez, Major de CS, cinturões WBA/WBC/IBF/WBO, Bola de Ouro',
  continental: 'Copa Libertadores, Eurocopa, Pan-Americano, Europeu de Xadrez, IEM regional',
  national: 'Brasileirão, Troféu José Finkel, Brasileiro de Xadrez, Gamers Club Liga Série A',
  local: 'Estaduais (Paulistão, Carioca), torneios municipais e regionais',
};

const w = COMPETITION_LEVEL_WEIGHT;

export const CRITERIA_DOC: DocumentContent = {
  title: 'Como escolhemos',
  eyebrow: 'Sobre',
  lead: 'O World All Stars não é um banco de todos os atletas: é um hall da fama global. Veja quem entra, como o nível de cada campeão é definido e o que faz alguém ser Mítico.',
  sections: [
    {
      id: 'grande-campeao',
      title: 'O que é um grande campeão',
      blocks: [
        {
          kind: 'p',
          text: 'Um atleta entra no site se cumprir pelo menos um critério do seu esporte. Os critérios são públicos, versionados e ajustáveis pela curadoria. Quem não cumpre pode ser aprovado com justificativa registrada e visível.',
        },
        {
          kind: 'p',
          text: 'Os dados vêm sempre das fontes coletadas, com origem em cada campo. Ninguém edita dados à mão: quem tem conta vota no nível e comenta.',
        },
      ],
    },
    {
      id: 'criterios',
      title: 'Critérios de inclusão por esporte',
      blocks: [
        {
          kind: 'table',
          caption: 'Critérios de inclusão dos esportes do lançamento',
          headers: ['Esporte', 'Entra quem cumprir pelo menos um'],
          rows: [
            ['Futebol', 'Bola de Ouro ou FIFA The Best · campeão mundial com prêmio individual na Copa (Bola de Ouro da Copa, artilheiro) · top 10 artilheiros históricos oficiais'],
            ['Natação', '2 ou mais ouros olímpicos individuais · recordista mundial em prova olímpica por 2 anos ou mais · 5 ou mais títulos mundiais individuais'],
            ['Xadrez', 'Campeão mundial (clássico, linha histórica e FIDE) · nº 1 do rating FIDE por 12 meses ou mais · campeã mundial feminina'],
            ['Boxe', 'Campeão indiscutido (todos os cinturões principais) · campeão linear · membro do International Boxing Hall of Fame'],
            ['Counter-Strike', 'Campeão de Major com prêmio de MVP · 2 ou mais Majors · nº 1 do ranking anual HLTV Top 20'],
          ],
        },
        { kind: 'notice', tone: 'info', text: 'Os demais esportes do site seguem a mesma lógica; os critérios de cada um são publicados aqui conforme a curadoria os aprova.' },
      ],
    },
    {
      id: 'niveis',
      title: 'Níveis de campeão',
      blocks: [{ kind: 'p', text: 'Entrar no site já significa ser campeão. O nível mede o tamanho do legado dentro do próprio esporte.' }],
    },
    {
      id: 'como-atribui',
      title: 'Como o nível é atribuído',
      blocks: [
        {
          kind: 'list',
          ordered: true,
          items: [
            `Pontuação objetiva (legacy score): soma das conquistas, com peso pelo nível da competição (mundial ${w.world}, continental ${w.continental}, nacional ${w.national}, local ${w.local}), raridade, anos no topo e recordes vigentes.`,
            'A pontuação vira percentil dentro do esporte, porque um título mundial no xadrez não equivale a um no futebol.',
            `Sugestão automática: percentil ${TIER_PERCENTILE_THRESHOLD.legendary} ou mais → candidato a Lendário; ${TIER_PERCENTILE_THRESHOLD.elite} ou mais → Elite; o resto → Campeão.`,
            'Mítico nunca é automático: exige o dossiê “Mudou o jogo” (veja abaixo).',
            'Toda mudança de nível é versionada, com justificativa pública e histórico.',
          ],
        },
      ],
    },
    {
      id: 'mitico',
      title: 'Mítico e o Hall of Greats',
      blocks: [
        {
          kind: 'p',
          text: `Para ser Mítico, o atleta precisa de um dossiê com pelo menos ${MYTHIC_MIN_EVIDENCES} das evidências abaixo, revisado e aprovado pela curadoria (de preferência por dois administradores). Os Míticos formam o Hall of Greats.`,
        },
        {
          kind: 'list',
          items: [
            'Técnica, estilo ou estratégia que leva o nome dele ou virou padrão.',
            'Recorde que durou décadas ou redefiniu o limite do esporte.',
            'Mudança de regra, formato ou mercado provocada por ele.',
            'Popularização global do esporte ou de uma região.',
            'Reconhecimento institucional como o maior de todos (prêmio “do século”, honra máxima de um hall da fama).',
          ],
        },
      ],
    },
    {
      id: 'campeonatos',
      title: 'Nível de campeonato e prêmio',
      blocks: [
        {
          kind: 'p',
          text: 'Toda competição e todo prêmio têm um nível, exibido em cada conquista e usado nos filtros. Os Jogos Olímpicos são mundiais; prêmios usam a mesma escala.',
        },
      ],
    },
    {
      id: 'comunidade',
      title: 'O voto da comunidade',
      blocks: [
        {
          kind: 'p',
          text: 'Quem tem conta vota no nível que acha justo para cada atleta (um voto por atleta, que pode ser mudado). Quando a maioria discorda do nível oficial, a curadoria recebe um sinal para rever o caso. Quem decide é sempre a curadoria, com justificativa.',
        },
      ],
    },
  ],
};
