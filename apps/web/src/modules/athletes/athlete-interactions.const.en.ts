import type { Messages } from '@was/shared';

import type { ATHLETE_INTERACTIONS_TEXT } from './athlete-interactions.const';

export const ATHLETE_INTERACTIONS_TEXT_EN = {
  groupLabel: 'Star and hearts',
  star: (count) => `Give my star (${count} ${count === 1 ? 'star' : 'stars'})`,
  unstar: (count) => `Take my star back (${count} ${count === 1 ? 'star' : 'stars'})`,
  heart: (count) => `Give a heart (${count} ${count === 1 ? 'heart' : 'hearts'})`,
  unheart: (count) => `Take my heart back (${count} ${count === 1 ? 'heart' : 'hearts'})`,
  starHint: 'You have a single star: giving it here takes it from whoever had it.',
  starElsewhere: (name) => `Your star is with ${name}. Giving it here will move it.`,
  failed: 'Could not save. Try again.',
} satisfies Messages<typeof ATHLETE_INTERACTIONS_TEXT>;
