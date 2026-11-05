import { describe, expect, it } from 'vitest';

import { bestFlags } from './analysis.helper';

describe('bestFlags', () => {
  it('marks the highest or lowest value', () => {
    expect(bestFlags([3, 5, null], true)).toEqual([false, true, false]);
    expect(bestFlags(['2', '6'], false)).toEqual([true, false]);
  });
  it('ignores ties, single values and unranked rows', () => {
    expect(bestFlags([4, 4], true)).toEqual([false, false]);
    expect(bestFlags([4, null], true)).toEqual([false, false]);
    expect(bestFlags([1, 2], null)).toEqual([false, false]);
  });
});
