
// UI strings of the error pages (pt-BR, ready to become an i18n namespace). Doc 09 P20: search + shortcuts.
export const ERRORS_TEXT = {
  shortcutsLabel: 'Atalhos',
  searchHint: 'Use a busca no topo da página (atalho: tecla /) para achar um campeão pelo nome.',
  shortcuts: [
    { to: '/', label: 'Início', hint: 'Globo, hoje na história e calendário' },
    { to: '/athletes', label: 'Atletas', hint: 'Todos os campeões, com filtros' },
    { to: '/sports', label: 'Esportes', hint: 'Esportes, ligas e federações' },
    { to: '/hall-of-greats', label: 'Hall of Greats', hint: 'Os Míticos que mudaram o jogo' },
  ] as const,
  notFound: {
    code: '404',
    eyebrow: 'Erro 404',
    title: 'Página não encontrada',
    text: 'O endereço pode ter mudado ou o registro foi removido. Busque um campeão pelo nome ou siga um dos atalhos.',
    path: 'Endereço',
    home: 'Voltar ao início',
    report: 'Avisar sobre um link quebrado',
  },
  generic: {
    code: '!',
    eyebrow: 'Erro',
    title: 'Algo deu errado',
    text: 'Não foi possível mostrar esta página. Tente de novo; se o problema continuar, avise pela página Contato.',
    retry: 'Tentar novamente',
    home: 'Voltar ao início',
    details: 'Detalhes técnicos',
    report: 'Avisar a curadoria',
  },
} as const;
