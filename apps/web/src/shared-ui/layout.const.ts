// UI strings of the shared layout (pt-BR). Ready to move to i18n namespaces (packages/shared/i18n) later.
export const MAIN_CONTENT_ID = 'conteudo';

export const NAV_ITEMS = [
  { to: '/hall-of-greats', label: 'Hall of Greats', featured: true },
  { to: '/athletes', label: 'Atletas', featured: false },
  { to: '/sports', label: 'Esportes', featured: false },
  { to: '/sources', label: 'Fontes', featured: false },
  { to: '/contact', label: 'Contato', featured: false },
] as const;

export const LAYOUT_TEXT = {
  brand: 'World All Stars',
  skipLink: 'Pular para o conteúdo',
  navLabel: 'Principal',
  language: 'PT',
  languageLabel: 'Idioma: português. Outros idiomas em breve',
  signIn: 'Entrar',
  themeToDark: 'Mudar para o tema escuro',
  themeToLight: 'Mudar para o tema claro',
  searchLabel: 'Buscar campeão',
  searchPlaceholder: 'Buscar campeão pelo nome ou apelido',
  footerSources: 'Fontes e licenças desta página: Natural Earth (domínio público) no mapa do globo.',
  footerNote: 'Os dados vêm das fontes listadas na página Fontes; cada campo tem sua origem.',
  footerExplore: 'Explorar',
  footerProject: 'Projeto',
  footerHowWeChoose: 'Como escolhemos',
  footerLicenses: 'Licenças',
  footerLegal: 'Legal',
  menuOpen: 'Abrir menu',
  menuClose: 'Fechar menu',
} as const;

export const FOOTER_PROJECT_LINKS = [
  { to: '/about/criteria', label: 'Como escolhemos' },
  { to: '/sources', label: 'Fontes e licenças' },
  { to: '/accessibility', label: 'Acessibilidade' },
] as const;

export const FOOTER_LEGAL_LINKS = [
  { to: '/legal/privacy', label: 'Privacidade' },
  { to: '/legal/terms', label: 'Termos de uso' },
  { to: '/legal/cookies', label: 'Cookies' },
] as const;
