import type { AthleteProfile } from '@was/shared';
import { describe, expect, it } from 'vitest';

import { bjjResults, bjjSummary, isAbsoluteDivision } from './bjj-division.helper';

const cls = (dimension: string, value: string, label = value) => ({ dimension, value, label });
const result = (id: string, year: number, type: string, rank: number | null, classes?: ReturnType<typeof cls>[]) => ({
  id,
  kind: 'competition',
  type,
  year,
  rank,
  competition: { slug: 'ibjjf-world-championship', name: 'IBJJF Worlds' },
  isOlympic: false,
  ...(classes ? { classes } : {}),
});
const profile = (achievements: unknown[]) => ({ achievements }) as unknown as AthleteProfile;

describe('bjj divisions', () => {
  const p = profile([
    result('a', 2004, 'champion', null, [cls('belt', 'black'), cls('gi_mode', 'gi'), cls('weight', 'ultra-heavy', 'Ultra-heavy'), cls('sex_category', 'men')]),
    result('b', 2005, 'runner_up', null, [cls('belt', 'black'), cls('gi_mode', 'gi'), cls('weight', 'absolute', 'Absolute')]),
    result('c', 2005, 'bronze', 3, [cls('gi_mode', 'no-gi'), cls('weight', 'open-weight', 'Open weight')]),
    result('d', 2007, 'champion', null),
    { id: 'award', kind: 'award', type: 'award', year: 2010 },
  ]);

  it('reads belt, gi/no-gi, weight, absolute and placement of each competition result, newest first', () => {
    const rows = bjjResults(p);
    expect(rows.map((r) => r.id)).toEqual(['d', 'b', 'c', 'a']);
    expect(rows.find((r) => r.id === 'a')).toMatchObject({ belt: { value: 'black' }, gi: { value: 'gi' }, absolute: false, placement: 1 });
    expect(rows.find((r) => r.id === 'b')).toMatchObject({ absolute: true, placement: 2 });
    expect(rows.find((r) => r.id === 'd')).toMatchObject({ belt: null, gi: null, weight: null, placement: 1 });
  });

  it('summarizes belts, the gi/no-gi split, weight classes apart from the absolute, and podium placements', () => {
    const s = bjjSummary(bjjResults(p));
    expect(s.belts.map((b) => b.value)).toEqual(['black']);
    expect(s.gi.map((g) => [g.mode.value, g.count])).toEqual([
      ['gi', 2],
      ['no-gi', 1],
    ]);
    expect(s.weights.map((w) => w.value)).toEqual(['ultra-heavy']);
    expect(s.absolute).toBe(2);
    expect(s.podium).toEqual([2, 1, 1]);
  });

  it('recognises the open division by slug or label', () => {
    expect(isAbsoluteDivision(cls('weight', 'absoluto'))).toBe(true);
    expect(isAbsoluteDivision(cls('weight', 'x', 'Open class'))).toBe(true);
    expect(isAbsoluteDivision(cls('weight', '-76-kg', '−76 kg'))).toBe(false);
    expect(isAbsoluteDivision(null)).toBe(false);
  });
});
