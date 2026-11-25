import type { Messages } from '@was/shared';

import type { TIER_VOTE_FLAGS_TEXT } from './tier-vote-flags.const';

export const TIER_VOTE_FLAGS_TEXT_EN = {
  title: 'Flagged accounts',
  rule: (votes) =>
    `A burst of ${votes} or more votes on one athlete within 1 hour from accounts younger than 7 days flags those accounts. Their votes stay out of the signals until reviewed.`,
  caption: 'Accounts flagged by the tier-vote anti-fraud rule',
  empty: 'No flagged accounts.',
  account: 'Account',
  created: 'Created on',
  burst: 'Votes in the burst',
  accountVotes: 'Account votes',
  status: 'Status',
  statuses: { pending: 'Awaiting review', cleared: 'Cleared', rejected: 'Rejected' },
  excluded: 'Votes out of the signal',
  clear: 'Clear',
  reject: 'Reject',
  clearTitle: (account) => `Clear the votes of ${account}`,
  rejectTitle: (account) => `Reject the votes of ${account}`,
  clearText: 'This account’s votes count in the signals again.',
  rejectText: 'This account’s votes stay out of the signals for good.',
} satisfies Messages<typeof TIER_VOTE_FLAGS_TEXT>;
