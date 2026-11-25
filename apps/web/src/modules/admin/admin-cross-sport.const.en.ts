import type { Messages } from '@was/shared';

import type { ADMIN_CROSS_SPORT_TEXT } from './admin-cross-sport.const';

export const ADMIN_CROSS_SPORT_TEXT_EN: Messages<typeof ADMIN_CROSS_SPORT_TEXT> = {
  title: 'Bands: unmapped achievements',
  lead: 'Published competitive achievements that have no mapping row in the ruleset yet. They stay out of the band (never worth zero, never guessed) until the curators add the mapping.',
  navGroup: 'Cross-sport bands',
  navLink: 'Unmapped',
  caption: 'Unmapped achievements',
  competitor: 'Competitor',
  sport: 'Sport',
  kind: 'Kind',
  value: 'Value to map',
  achievement: 'Achievement',
  year: 'Year',
  kinds: { recognition: 'Title', result: 'Result' },
  total: (n: number) => (n === 1 ? '1 achievement under review' : `${n} achievements under review`),
  emptyTitle: 'Nothing to review',
  emptyText: 'Every published competitive achievement has a mapping.',
  methodologyLink: 'See the methodology and the current mappings',
};
