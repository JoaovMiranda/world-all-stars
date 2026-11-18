import { defineMessages } from '@was/shared';
import { ERRORS_TEXT_EN } from './errors.const.en';
import { ERRORS_TEXT_ES } from './errors.const.es';


/** Shortcuts of the error pages (routes are data; texts in ERRORS_TEXT.shortcuts). */
export const ERROR_SHORTCUTS = [
  { to: '/', key: 'home' },
  { to: '/athletes', key: 'athletes' },
  { to: '/sports', key: 'sports' },
  { to: '/hall-of-greats', key: 'hallOfGreats' },
] as const;

// UI strings of the error pages (pt-BR source; en/es next to it). Doc 09 P20: search + shortcuts.
export const ERRORS_TEXT = {
  shortcutsLabel: 'Atalhos',
  searchHint: 'Use a busca no topo da página (atalho: tecla /) para achar um campeão pelo nome.',
  shortcuts: {
    home: { label: 'Início', hint: 'Globo, hoje na história e calendário' },
    athletes: { label: 'Atletas', hint: 'Todos os campeões, com filtros' },
    sports: { label: 'Esportes', hint: 'Esportes, ligas e federações' },
    hallOfGreats: { label: 'Hall of Greats', hint: 'Os Míticos que mudaram o jogo' },
  },
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

export const ERRORS_MESSAGES = defineMessages(ERRORS_TEXT, { en: ERRORS_TEXT_EN, es: ERRORS_TEXT_ES });
