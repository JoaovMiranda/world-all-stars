import { defineMessages } from '@was/shared';

import { LAYOUT_TEXT_EN } from './layout.const.en';
import { LAYOUT_TEXT_ES } from './layout.const.es';

export const MAIN_CONTENT_ID = 'conteudo';

/** Main navigation (routes are data; labels come from LAYOUT_TEXT.links). */
export const NAV_ITEMS = [
  { to: '/hall-of-greats', labelKey: 'hallOfGreats', featured: true },
  { to: '/athletes', labelKey: 'athletes', featured: false },
  { to: '/sports', labelKey: 'sports', featured: false },
  { to: '/rankings', labelKey: 'rankings', featured: false },
  { to: '/sources', labelKey: 'sources', featured: false },
  { to: '/contact', labelKey: 'contact', featured: false },
] as const;

export const FOOTER_PROJECT_LINKS = [
  { to: '/about/criteria', labelKey: 'criteria' },
  { to: '/sources', labelKey: 'sourcesAndLicenses' },
  { to: '/accessibility', labelKey: 'accessibility' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { to: '/legal/privacy', labelKey: 'privacy' },
  { to: '/legal/terms', labelKey: 'terms' },
  { to: '/legal/cookies', labelKey: 'cookies' },
] as const;

// UI strings of the shared layout (pt-BR source; en/es next to this file).
export const LAYOUT_TEXT = {
  brand: 'World All Stars',
  /** Default <meta name="description"> (pages override it in their route head). */
  description: 'World All Stars: a enciclopédia dos maiores campeões de todos os esportes, com dados, fontes e história.',
  skipLink: 'Pular para o conteúdo',
  navLabel: 'Principal',
  languageLabel: (current: string) => `Idioma: ${current}. Trocar idioma`,
  languageMenu: 'Idioma',
  themeToDark: 'Mudar para o tema escuro',
  pauseAnimations: 'Pausar animações',
  themeToLight: 'Mudar para o tema claro',
  searchLabel: 'Buscar campeão',
  searchPlaceholder: 'Buscar campeão pelo nome ou apelido',
  footerSources: 'Fontes e licenças desta página: Natural Earth (domínio público) no mapa do globo.',
  footerNote: 'Os dados vêm das fontes listadas na página Fontes; cada campo tem sua origem.',
  footerExplore: 'Explorar',
  footerProject: 'Projeto',
  footerLegal: 'Legal',
  menuOpen: 'Abrir menu',
  menuClose: 'Fechar menu',
  links: {
    hallOfGreats: 'Hall of Greats',
    rankings: 'Rankings',
    athletes: 'Atletas',
    sports: 'Esportes',
    sources: 'Fontes',
    contact: 'Contato',
    criteria: 'Como escolhemos',
    sourcesAndLicenses: 'Fontes e licenças',
    accessibility: 'Acessibilidade',
    privacy: 'Privacidade',
    terms: 'Termos de uso',
    cookies: 'Cookies',
  },
} as const;

export const LAYOUT_MESSAGES = defineMessages(LAYOUT_TEXT, { en: LAYOUT_TEXT_EN, es: LAYOUT_TEXT_ES });
