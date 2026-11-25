import type { Messages } from '@was/shared';

import type { ACCOUNT_INTERACTIONS_TEXT } from './account-interactions.const';

export const ACCOUNT_INTERACTIONS_TEXT_EN = {
  starTitle: 'My star',
  starHint: 'Only you see this list. Each account has a single star; profiles only show the totals.',
  noStarTitle: 'No star given',
  noStarText: 'Give your star to the athlete you admire most, on their profile.',
  heartsTitle: 'My hearts',
  noHeartsTitle: 'No hearts yet',
  noHeartsText: 'Give as many hearts as you like on athlete profiles.',
  since: (date) => `since ${date}`,
  removeStar: (name) => `Take my star back from ${name}`,
  removeHeart: (name) => `Take my heart back from ${name}`,
  remove: 'Remove',
  browseAthletes: 'Browse athletes',
} satisfies Messages<typeof ACCOUNT_INTERACTIONS_TEXT>;
