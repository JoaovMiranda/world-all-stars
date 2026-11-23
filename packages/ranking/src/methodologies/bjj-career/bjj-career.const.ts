import type { RankingDefinition } from '../../core/ranking-definition.interface';

/** Rankings of the Jiu-Jitsu career methodology: belts, gi/no-gi and gender are separate classifications. */
export const BJJ_CAREER_RANKINGS: RankingDefinition[] = [
  { key: 'black-gi-men', title: 'Black belt · gi · men', scope: { belt: 'black', giMode: 'gi', gender: 'men' } },
  { key: 'black-gi-women', title: 'Black belt · gi · women', scope: { belt: 'black', giMode: 'gi', gender: 'women' } },
  { key: 'nogi-men', title: 'No-gi · men', scope: { belt: null, giMode: 'no-gi', gender: 'men' } },
  { key: 'nogi-women', title: 'No-gi · women', scope: { belt: null, giMode: 'no-gi', gender: 'women' } },
];
