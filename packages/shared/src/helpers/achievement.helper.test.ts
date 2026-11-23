import { describe, expect, it } from 'vitest';

import type { Achievement } from '../types/athlete-profile.type';
import { careerOverlapYears, competitionWins, isAwardAchievement, isCompetitionWin, winYearSpan } from './achievement.helper';

const comp = (type: string, year: number, level: string, slug = 'copa') =>
  ({ kind: 'competition', type, year, level, competition: { slug, name: slug } }) as unknown as Achievement;
const award = { kind: 'award', type: 'award', year: 2000, level: 'world' } as unknown as Achievement;

describe('achievement helpers', () => {
  const list = [
    comp('champion', 1958, 'world'),
    comp('silver', 1960, 'world'),
    comp('gold', 1962, 'continental', 'pan'),
    comp('title_won', 1970, 'national', 'br'),
    award,
  ];
  it('counts only winning results as titles', () => {
    expect(list.filter(isCompetitionWin)).toHaveLength(3);
    expect(competitionWins(list, 'copa')).toHaveLength(1);
    expect(isAwardAchievement(award)).toBe(true);
  });
  it('spans the first and last title at the given levels', () => {
    expect(winYearSpan(list, ['world', 'continental'])).toEqual([1958, 1962]);
    expect(winYearSpan(list, ['local'])).toBeNull();
  });
  it('measures overlapping careers', () => {
    expect(careerOverlapYears({ careerFrom: 1956, careerTo: 1977 }, { careerFrom: 1970, careerTo: null }, 2026)).toBe(8);
    expect(careerOverlapYears({ careerFrom: 1956, careerTo: 1960 }, { careerFrom: 2000, careerTo: null }, 2026)).toBe(0);
  });
});
