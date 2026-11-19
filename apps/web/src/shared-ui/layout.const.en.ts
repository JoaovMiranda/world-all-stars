import type { Messages } from '@was/shared';

import type { LAYOUT_TEXT } from './layout.const';

export const LAYOUT_TEXT_EN = {
  brand: 'World All Stars',
  description: 'World All Stars: the encyclopedia of the greatest champions in every sport, with data, sources and history.',
  skipLink: 'Skip to content',
  navLabel: 'Main',
  languageLabel: (current) => `Language: ${current}. Change language`,
  languageMenu: 'Language',
  themeToDark: 'Switch to dark theme',
  pauseAnimations: 'Pause animations',
  themeToLight: 'Switch to light theme',
  searchLabel: 'Search champions',
  searchPlaceholder: 'Search a champion by name or nickname',
  footerSources: 'Sources and licenses of this page: Natural Earth (public domain) on the globe map.',
  footerNote: 'Data comes from the sources listed on the Sources page; every field has its origin.',
  footerExplore: 'Explore',
  footerProject: 'Project',
  footerLegal: 'Legal',
  menuOpen: 'Open menu',
  menuClose: 'Close menu',
  links: {
    hallOfGreats: 'Hall of Greats',
    rankings: 'Rankings',
    athletes: 'Athletes',
    sports: 'Sports',
    sources: 'Sources',
    contact: 'Contact',
    criteria: 'How we choose',
    sourcesAndLicenses: 'Sources and licenses',
    accessibility: 'Accessibility',
    privacy: 'Privacy',
    terms: 'Terms of use',
    cookies: 'Cookies',
  },
} satisfies Messages<typeof LAYOUT_TEXT>;
