import type { Messages } from '@was/shared';

import type { RANKINGS_TEXT } from './rankings.const';

export const RANKINGS_TEXT_EN: Messages<typeof RANKINGS_TEXT> = {
  list: {
    title: 'Rankings',
    eyebrow: 'Calculated by methodology, published after a double review',
    lead: 'Each sport has its own methodology: what counts, how ties are broken and what is left out. A published ranking never changes; a correction is a new version.',
    emptyTitle: 'No ranking published yet',
    emptyText: 'Rankings appear here once calculated and approved by two different curators.',
    entries: (n: number) => (n === 1 ? '1 ranked' : `${n} ranked`),
    published: (date: string) => `Published on ${date}`,
    methodology: 'Methodology',
  },
  detail: {
    breadcrumb: 'Rankings',
    rank: 'Rank',
    competitor: 'Competitor',
    score: 'Points',
    tied: 'tie',
    notEligible: 'Not ranked',
    hash: 'Reproduction hash',
    metrics: { credits: 'Credits', worldCups: 'World Cups', olympicGolds: 'Golds', verifiedAppearances: 'Verified appearances', earliestYear: 'First title', points: 'Points', worldTitles: 'World titles', golds: 'Golds', results: 'Results' },
    notFoundTitle: 'Ranking not found',
    notFoundText: 'This ranking does not exist or has not been published yet.',
    previous: 'Previous',
    next: 'Next',
  },
};
