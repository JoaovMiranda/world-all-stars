import type { Messages } from '@was/shared';

import type { ON_THIS_DAY_TEXT } from './on-this-day.const';

export const ON_THIS_DAY_TEXT_EN = {
  eyebrow: 'On this day',
  title: (dayLabel) => `${dayLabel} in sports history`,
  lead: 'Births, titles and milestones of the champions on file on this day, in any year.',
  dayNav: 'Navigate between days',
  prev: (label) => `← ${label}`,
  next: (label) => `${label} →`,
  prevLabel: (label) => `Previous day: ${label}`,
  nextLabel: (label) => `Next day: ${label}`,
  observance: 'Sport day',
  seeSport: (name) => `See ${name}`,
  seeCalendar: 'See in the calendar',
  groups: {
    births: 'Births',
    achievements: 'Titles and milestones',
    deaths: 'Deaths',
  },
  count: (n) => (n === 1 ? '1 entry' : `${n} entries`),
  emptyTitle: (label) => `No milestones recorded on ${label}`,
  emptyText: 'Champions’ births, titles and records show up here as the collection grows. Browse the neighboring days or explore the athletes.',
  emptyAction: 'See athletes',
} satisfies Messages<typeof ON_THIS_DAY_TEXT>;
