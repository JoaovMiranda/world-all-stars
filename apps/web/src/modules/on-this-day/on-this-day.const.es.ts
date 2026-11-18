import type { Messages } from '@was/shared';

import type { ON_THIS_DAY_TEXT } from './on-this-day.const';

export const ON_THIS_DAY_TEXT_ES = {
  eyebrow: 'Un día como hoy',
  title: (dayLabel) => `${dayLabel} en la historia del deporte`,
  lead: 'Nacimientos, títulos e hitos de los campeones registrados en este día, en cualquier año.',
  dayNav: 'Navegar entre los días',
  prev: (label) => `← ${label}`,
  next: (label) => `${label} →`,
  prevLabel: (label) => `Día anterior: ${label}`,
  nextLabel: (label) => `Día siguiente: ${label}`,
  observance: 'Día del deporte',
  seeSport: (name) => `Ver ${name}`,
  seeCalendar: 'Ver en el calendario',
  groups: {
    births: 'Nacimientos',
    achievements: 'Títulos e hitos',
    deaths: 'Fallecimientos',
  },
  count: (n) => (n === 1 ? '1 registro' : `${n} registros`),
  emptyTitle: (label) => `Ningún hito registrado el ${label}`,
  emptyText: 'Los nacimientos, títulos y récords de los campeones aparecen aquí a medida que crece el archivo. Navega a los días cercanos o explora los atletas.',
  emptyAction: 'Ver atletas',
} satisfies Messages<typeof ON_THIS_DAY_TEXT>;
