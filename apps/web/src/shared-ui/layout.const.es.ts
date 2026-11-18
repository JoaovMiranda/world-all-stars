import type { Messages } from '@was/shared';

import type { LAYOUT_TEXT } from './layout.const';

export const LAYOUT_TEXT_ES = {
  brand: 'World All Stars',
  description: 'World All Stars: la enciclopedia de los mayores campeones de todos los deportes, con datos, fuentes e historia.',
  skipLink: 'Saltar al contenido',
  navLabel: 'Principal',
  languageLabel: (current) => `Idioma: ${current}. Cambiar idioma`,
  languageMenu: 'Idioma',
  signIn: 'Entrar',
  themeToDark: 'Cambiar al tema oscuro',
  themeToLight: 'Cambiar al tema claro',
  searchLabel: 'Buscar campeón',
  searchPlaceholder: 'Buscar un campeón por nombre o apodo',
  footerSources: 'Fuentes y licencias de esta página: Natural Earth (dominio público) en el mapa del globo.',
  footerNote: 'Los datos proceden de las fuentes listadas en la página Fuentes; cada campo tiene su origen.',
  footerExplore: 'Explorar',
  footerProject: 'Proyecto',
  footerLegal: 'Legal',
  menuOpen: 'Abrir menú',
  menuClose: 'Cerrar menú',
  links: {
    hallOfGreats: 'Hall of Greats',
    athletes: 'Atletas',
    sports: 'Deportes',
    sources: 'Fuentes',
    contact: 'Contacto',
    criteria: 'Cómo elegimos',
    sourcesAndLicenses: 'Fuentes y licencias',
    accessibility: 'Accesibilidad',
    privacy: 'Privacidad',
    terms: 'Términos de uso',
    cookies: 'Cookies',
  },
} satisfies Messages<typeof LAYOUT_TEXT>;
