import type { GovernanceModel, OrgNature } from '@was/shared';

// UI strings of the sports module (pt-BR, ready to become an i18n namespace).
export const SPORTS_TEXT = {
  list: {
    title: 'Esportes e associações',
    eyebrow: 'Esportes · quem manda em cada um',
    breadcrumb: 'Esportes e associações',
    lead: 'Cada esporte com suas associações: federações, ligas, empresas e marcas que governam ou organizam as competições. O nome de uma associação abre a página dela na Wikipedia; o card leva à página do esporte.',
    searchLabel: 'Buscar esporte ou associação',
    searchPlaceholder: 'Buscar esporte ou associação (ex.: FIFA, UFC, xadrez)',
    filtersLabel: 'Buscar e filtrar esportes',
    governanceLabel: 'Modelo de governança',
    groupCount: (n: number) => (n === 1 ? '1 esporte' : `${n} esportes`),
    associations: (n: number) => (n === 1 ? 'Associações · 1' : `Associações · ${n}`),
    noAssociations: 'Nenhuma associação no banco.',
    seeAll: (n: number) => `Ver todas as ${n} associações →`,
    seeSport: 'Ver o esporte →',
    noMatchTitle: 'Nenhum esporte com esses filtros',
    noMatchText: 'Tente outro nome de esporte ou de associação, ou limpe os filtros.',
    emptyTitle: 'Nenhum esporte cadastrado ainda',
    emptyText: 'Os esportes aparecem aqui com seus campeões, competições e as associações que mandam neles.',
    emptyAction: 'Sugerir um atleta',
  },
  models: {
    title: 'Modelos de governança',
    eyebrow: 'como o poder se organiza',
    none: 'Nenhum esporte neste modelo.',
    emptyTitle: 'Nenhum modelo de governança cadastrado',
    emptyText: 'Os modelos (pirâmide, condomínio, livre mercado, publisher e cultura) aparecem quando houver esportes classificados.',
  },
  hierarchy: {
    title: 'Hierarquia completa das associações',
    count: (orgs: number, roots: number) => `${orgs} associações · ${roots} raízes`,
    intro: 'Quem é membro de quem, quem licencia quem. Cada associação tem um tipo e uma natureza (associação sem fins lucrativos, empresa, marca, comunidade, mídia).',
    natureLabel: 'Filtrar por natureza',
    governs: 'Governa',
    relationUp: (label: string) => `${label} ↑`,
    noMatch: 'Nenhuma associação desta natureza.',
    emptyTitle: 'Nenhuma associação cadastrada',
    emptyText: 'A hierarquia (federações, ligas, empresas e marcas) aparece aqui conforme as associações forem coletadas.',
  },
  page: {
    title: 'Esporte',
    eyebrow: 'Esporte',
    sports: 'Esportes',
    notFoundTitle: 'Esporte não encontrado',
    metaDescription: (name: string) => `${name}: maiores campeões, competições, associações e próximos eventos no World All Stars.`,
    notFoundText: 'Este esporte não existe ou ainda não foi cadastrado.',
    backToSports: 'Ver todos os esportes',
    team: 'coletivo',
    individual: 'individual',
    wikipedia: 'Ler na Wikipedia',
    wikidata: (qid: string) => `Wikidata ${qid}`,
    external: '(abre em nova aba)',
    filtersLabel: 'Buscar e filtrar neste esporte',
    searchLabel: 'Buscar neste esporte',
    searchPlaceholder: 'Buscar campeão, competição ou categoria',
    country: 'País do atleta',
    allCountries: 'Todos os países',
    tier: 'Nível do atleta',
    allTiers: 'Todos os níveis',
    level: 'Nível da competição',
    allLevels: 'Todas as competições',
    resultSummary: (athletes: number, totalAthletes: number, comps: number, totalComps: number) =>
      `${athletes} de ${totalAthletes} campeões · ${comps} de ${totalComps} competições`,
    champions: 'Campeões',
    seeAllChampions: 'Ver todos',
    noChampionsFilter: 'Nenhum campeão com esses filtros',
    noChampionsTitle: 'Nenhum campeão cadastrado ainda',
    noChampionsText: 'Os maiores campeões deste esporte aparecem aqui assim que forem coletados e aprovados.',
    reportTitle: 'Nenhum atleta individual identificado em fonte pública.',
    reportFacts: 'O que a coleta encontrou',
    evidence: (quote: string | null) => (quote ? `Trecho literal: ${quote}` : 'Ver a fonte'),
    evidenceLabel: (n: number) => `Fonte do fato ${n} (abre em nova aba)`,
    competitions: 'Competições e títulos',
    competitionsEyebrow: 'por nível',
    competitionsCaption: 'Competições do esporte, por nível',
    colCompetition: 'Competição',
    colLevel: 'Nível',
    colOrganizer: 'Organizador',
    colEditions: 'Edições no banco',
    colWinners: 'Campeões ligados',
    noCompetitions: 'Nenhuma competição com esses filtros.',
    rules: 'Regras básicas',
    noRules: 'As regras deste esporte ainda não foram resumidas.',
    categories: 'Categorias',
    noCategories: 'Nenhuma categoria cadastrada.',
    upcoming: 'Próximos campeonatos',
    noUpcoming: 'Nada agendado no banco',
    observances: 'Dias do esporte',
    noObservances: 'Nenhum dia comemorativo oficial encontrado para este esporte.',
    whoRules: 'Quem manda',
    pinnacle: 'O ápice',
    prizeForms: 'Formas de premiação',
    environment: 'Ambiente',
    seeAssociations: 'Ver todas as associações',
    associationsOf: (name: string) => `Associações de ${name}`,
    associationsEyebrow: (n: number) => `${n} · governam ou organizam`,
    noAssociations: 'Nenhuma associação no banco.',
    associationsHint: 'O nome abre a página na Wikipedia; o ⓘ mostra o resumo e a hierarquia.',
    fullHierarchy: 'Ver a hierarquia completa',
    dash: '—',
  },
} as const;

/** Governance models (doc 18), labels of the /sports filter chips and card badges. */
export const GOVERNANCE_LABEL: Record<GovernanceModel, string> = {
  pyramid: 'Pirâmide tradicional',
  condominium: 'Condomínio de associações',
  free_market: 'Livre mercado',
  publisher: 'Pirâmide invertida (publisher)',
  cultural: 'Identidade e cultura',
};

/** Nature of an organization (doc 19), labels of the hierarchy filter. */
export const ORG_NATURE_LABEL: Record<OrgNature, string> = {
  association: 'Associação sem fins lucrativos',
  company: 'Empresa',
  brand: 'Marca',
  community: 'Comunidade / cultura',
  media: 'Mídia',
  unknown: 'A classificar',
};

/** Prize forms (doc 19 category). Unknown keys fall back to the raw value. */
export const PRIZE_FORM_LABEL: Record<string, string> = {
  medal: 'Medalha',
  belt: 'Cinturão',
  championship_trophy: 'Troféu de campeão',
  title_rank: 'Graduação / título vitalício',
  ranking: 'Posição em ranking',
  individual_award: 'Prêmio individual (eleição)',
  hall_of_fame: 'Hall da fama',
  pro_card: 'Cartão profissional',
  traditional_trophy: 'Troféu ou artesanato tradicional',
};

export const PERIODICITY_LABEL: Record<string, string> = {
  annual: 'anual',
  biennial: 'bienal',
  quadrennial: 'quadrienal',
  irregular: 'irregular',
  continuous: 'título contínuo (cinturão)',
};

export const ENVIRONMENT_LABEL: Record<string, { name: string; summary: string }> = {
  closed: { name: 'Fechado', summary: 'Depende quase só do próprio atleta e do relógio/juízes.' },
  open: { name: 'Aberto', summary: 'Caótico: depende de adversários, tática e, às vezes, companheiros.' },
};

export const FORMAT_LABEL: Record<string, string> = {
  individual: 'individual',
  duel: '1 contra 1',
  team: 'em equipe',
  judged: 'julgado por juízes',
};

/** In-page anchors (linked from cards, the sport page and the /organizations redirect). */
export const SPORTS_HASH = { hierarchy: 'hierarquia', associations: 'associacoes' } as const;
