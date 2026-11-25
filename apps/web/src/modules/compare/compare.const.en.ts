import type { Messages } from '@was/shared';

import type { COMPARE_TEXT } from './compare.const';

export const COMPARE_TEXT_EN: Messages<typeof COMPARE_TEXT> = {
  page: {
    title: 'Compare competitors',
    eyebrow: 'Head to head',
    lead: 'Two competitors side by side: sports, cross-sport band, legacy, titles and medals, methodology score (same sport only) and sources.',
    breadcrumb: 'Athletes',
    disclaimerTitle: 'Approximate comparison',
    disclaimer:
      'Across different sports, the comparison uses only the band (S to D) and the legacy level. Methodology scores appear only when both compete in the same sport.',
    pickerLabel: 'Choice of competitors',
    sideA: 'Competitor A',
    sideB: 'Competitor B',
    choose: 'Choose a competitor',
    swap: 'Swap sides',
    pickHint: 'Choose two competitors to see them side by side.',
    sameHint: 'Choose two different competitors.',
    shareHint: 'The address of this page keeps your choice: copy it to share the comparison.',
    notFoundTitle: 'Competitor not found',
    notFoundText: 'One of the chosen competitors does not exist or has no public profile. Choose another one.',
  },
  table: {
    caption: (a: string, b: string) => `Comparison between ${a} and ${b}`,
    criterion: 'Criterion',
    sports: 'Sports',
    band: 'Cross-sport band',
    bandItems: 'Accepted band items',
    legacy: 'Legacy level',
    titles: 'Titles and medals',
    sources: 'Sources',
    noBand: 'No band',
    none: 'None',
    count: (label: string, n: number) => `${label}: ${n}`,
    pending: (n: number) => (n === 1 ? '1 achievement awaiting review' : `${n} achievements awaiting review`),
    legacyScore: (n: string) => `${n} legacy points`,
  },
  methodology: {
    title: 'Methodology score',
    lead: (sports: string) => `Published rankings of ${sports}, the shared sport.`,
    crossSport: 'They compete in different sports: methodology scores are not compared. Use the cross-sport band above.',
    empty: 'No published ranking of the shared sport includes these competitors yet.',
    caption: 'Position and score in each published ranking of the shared sport',
    ranking: 'Ranking',
    position: (rank: number, tied: boolean) => `${tied ? '=' : ''}#${rank}`,
    score: (n: string) => `${n} pts`,
    notRanked: 'Not ranked',
  },
  footer: {
    rulesets: (band: string, legacy: string) => `Rulesets: ${band} · ${legacy}`,
    bandsMethodology: 'How the bands are calculated',
  },
  profileLink: 'Compare with another competitor',
};
