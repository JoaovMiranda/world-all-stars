import { defineMessages } from '@was/shared';

import { HOME_TEXT_EN } from './home.const.en';
import { HOME_TEXT_ES } from './home.const.es';

// UI strings of the home page (pt-BR source; en/es next to it).
export const HOME_TEXT = {
  documentTitle: 'World All Stars · Enciclopédia de campeões',
  intro: {
    kicker: 'Enciclopédia de campeões',
    titleBefore: 'Os maiores campeões de ',
    titleHighlight: 'todos os esportes',
    titleAfter: ', com dados, fontes e história.',
    subtitle: 'Do futebol ao xadrez, do sumô aos esports. Carreiras, conquistas e recordes num só lugar.',
    random: 'Me surpreenda: atleta aleatório',
    randomEmpty: 'O sorteio fica disponível assim que o primeiro campeão for cadastrado.',
    randomLoading: 'Carregando o acervo…',
    allAthletes: 'Ver todos os atletas',
    stats: { label: 'O acervo em números', athletes: 'atletas', sports: 'esportes', mythics: 'Míticos', titles: 'títulos' },
  },
  globe: {
    title: 'Campeões pelo mundo',
    subtitle: 'títulos dos atletas cadastrados, por nacionalidade',
    ariaLabel: 'Globo terrestre interativo. Arraste ou use as setas do teclado para girar; para escolher um país, use a lista de países ao lado.',
    roleDescription: 'globo',
    loadingMap: 'Carregando mapa…',
    mapError: 'Não foi possível carregar o mapa.',
    hint: 'Arraste para girar · clique num país · setas do teclado',
    selected: 'País selecionado',
    titles: 'títulos',
    noTitlesCountry: 'Nenhum campeão deste país cadastrado ainda.',
    countriesWithTitles: 'Países com títulos',
    seeAthletes: 'Ver atletas',
    emptyTitle: 'Nenhum título registrado ainda',
    emptyText: 'Quando os primeiros campeões forem cadastrados, cada país ganha cor conforme o número de títulos dos seus atletas.',
    legendNone: 'sem títulos',
    legendMore: 'mais títulos',
    emptyHint: 'Enquanto isso, gire o globo e clique num país.',
  },
  today: {
    label: 'Hoje na história',
    backToToday: 'voltar a hoje',
    emptyTitle: 'Nenhum marco registrado para este dia',
    emptyText: 'Nascimentos, conquistas e recordes dos campeões aparecem aqui conforme o acervo cresce.',
    observanceToday: 'Neste dia',
    observanceNext: 'Próximo',
    noObservance: 'Nenhum dia do esporte cadastrado ainda.',
  },
  calendar: {
    title: 'Calendário',
    exampleHint: 'listras = edição de exemplo',
    prevMonth: 'Mês anterior',
    nextMonth: 'Próximo mês',
    today: 'Hoje',
    filters: 'Filtros do calendário',
    moreSports: (n: number) => `+ ${n} ${n === 1 ? 'esporte' : 'esportes'}`,
    fewerSports: 'Menos esportes',
    emptyNotice: 'Ainda não há campeonatos nem dias do esporte cadastrados. A grade fica pronta para recebê-los.',
    emptyDay: 'Nenhum campeonato ou dia do esporte nesta data.',
    events: (n: number) => (n === 1 ? '1 evento' : `${n} eventos`),
    /** Screen-reader rest of a day cell after its number ("7" + " de novembro: 2 eventos"). */
    gridHint: 'Use as setas para mudar de dia, Page Up e Page Down para mudar de mês.',
    exampleSuffix: ' (exemplo)',
    cellSuffix: (month: string, events: string) => ` de ${month}: ${events}`,
    weekdays: ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom'],
  },
  upcoming: {
    title: 'Próximos 30 dias',
    emptyTitle: 'Nada nos próximos 30 dias',
    emptyText: 'Campeonatos e dias do esporte cadastrados aparecem aqui, com data, esporte e nível.',
  },
  greats: {
    kicker: 'Hall of Greats',
    title: 'Os que mudaram o jogo',
    seeHall: 'Ver o Hall',
    emptyTitle: 'Nenhum Mítico ainda',
    emptyText: 'O Hall of Greats recebe só atletas Míticos, com dossiê aprovado. Os primeiros nomes entram aqui assim que forem consagrados.',
    emptyAction: 'Como alguém vira Mítico',
  },
  sports: {
    title: 'Explorar por esporte',
    all: 'Todos os esportes',
    emptyTitle: 'Nenhum esporte cadastrado ainda',
    emptyText: 'Os esportes aparecem aqui com o número de campeões e de Míticos de cada um.',
    emptyAction: 'Sugerir um atleta',
  },
  error: {
    title: 'Não foi possível carregar a página inicial',
    text: 'Verifique sua conexão e tente de novo. Se o problema continuar, avise pela página Contato.',
    retry: 'Tentar novamente',
  },
} as const;

export const HOME_MESSAGES = defineMessages(HOME_TEXT, { en: HOME_TEXT_EN, es: HOME_TEXT_ES });
