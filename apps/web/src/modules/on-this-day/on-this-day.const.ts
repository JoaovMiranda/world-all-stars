import { defineMessages, type OnThisDayKind } from '@was/shared';

import { ON_THIS_DAY_TEXT_EN } from './on-this-day.const.en';
import { ON_THIS_DAY_TEXT_ES } from './on-this-day.const.es';

// UI strings of the on-this-day module (pt-BR source; en/es next to it).
export const ON_THIS_DAY_TEXT = {
  eyebrow: 'Hoje na história',
  title: (dayLabel: string) => `${dayLabel} na história do esporte`,
  lead: 'Nascimentos, conquistas e marcos dos campeões cadastrados neste dia, em qualquer ano.',
  dayNav: 'Navegar entre os dias',
  prev: (label: string) => `← ${label}`,
  next: (label: string) => `${label} →`,
  prevLabel: (label: string) => `Dia anterior: ${label}`,
  nextLabel: (label: string) => `Próximo dia: ${label}`,
  observance: 'Dia do esporte',
  seeSport: (name: string) => `Ver ${name}`,
  seeCalendar: 'Ver no calendário',
  groups: {
    births: 'Nascimentos',
    achievements: 'Conquistas e marcos',
    deaths: 'Falecimentos',
  },
  count: (n: number) => (n === 1 ? '1 registro' : `${n} registros`),
  emptyTitle: (label: string) => `Nenhum marco registrado em ${label}`,
  emptyText: 'Nascimentos, conquistas e recordes dos campeões aparecem aqui conforme o acervo cresce. Navegue para os dias vizinhos ou explore os atletas.',
  emptyAction: 'Ver atletas',
} as const;

/** Groups of the day page, in reading order (doc 09 P13: births · titles · deaths). */
export const ON_THIS_DAY_GROUPS: readonly { key: keyof typeof ON_THIS_DAY_TEXT.groups; kinds: readonly OnThisDayKind[] }[] = [
  { key: 'births', kinds: ['birth'] },
  { key: 'achievements', kinds: ['title', 'record', 'career'] },
  { key: 'deaths', kinds: ['death'] },
];

export const ON_THIS_DAY_MESSAGES = defineMessages(ON_THIS_DAY_TEXT, { en: ON_THIS_DAY_TEXT_EN, es: ON_THIS_DAY_TEXT_ES });
