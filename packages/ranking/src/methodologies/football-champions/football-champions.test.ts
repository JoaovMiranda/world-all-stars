// Hand-computed goldens per competition family and gender (T2.1, D05/D06; METHODOLOGY.md §Worked examples per family).
// Input: offline fixture test-fixtures/football-champions/scope-families.json.
import { describe, expect, it } from 'vitest';

import { runRanking } from '../../core/engine.helper';
import { loadRankingFixture } from '../../helpers/fixture.helper';
import { FootballChampionsMethodology } from './football-champions.methodology';

const football = new FootballChampionsMethodology();
const input = loadRankingFixture('football-champions', 'scope-families');
const table = (key: string) => runRanking(football, key, input).entries.map((e) => [e.competitorId, e.rank, e.score, e.eligible]);

describe('football champions per family and gender (T2.1)', () => {
  it('ships one ranking per family and gender, one per continental championship and the overview', () => {
    const keys = football.rankings(football.defaultConfig).map((r) => r.key);
    expect(keys.slice(0, 4)).toEqual(['world-cup-men', 'world-cup-women', 'olympic-men', 'olympic-women']);
    expect(keys).toContain('continental-conmebol-men');
    expect(keys).toContain('continental-uefa-women');
    expect(keys.at(-1)).toBe('overview');
    expect(keys).toHaveLength(4 + 12 + 1);
  });

  it("World Cup family, men: M1 3 · M2 2 (duplicate 2002 ignored) · M3 1 (reserve, never played); withdrawn M4 ineligible", () => {
    expect(table('world-cup-men')).toEqual([
      ['m1', 1, 3, true],
      ['m2', 2, 2, true],
      ['m3', 3, 1, true],
      ['m4', null, 0, false],
    ]);
  });

  it("World Cup family, women: W1 2 · W2 1 (never played); provisional W3 ineligible; Olympic gold of W1 not counted here", () => {
    expect(table('world-cup-women')).toEqual([
      ['w1', 1, 2, true],
      ['w2', 2, 1, true],
      ['w3', null, 0, false],
    ]);
  });

  it('Olympic family: O1 2 · O2 1 (played) before O3 1 (replacement, never played); women separate', () => {
    expect(table('olympic-men')).toEqual([
      ['o1', 1, 2, true],
      ['o2', 2, 1, true],
      ['o3', 3, 1, true],
    ]);
    expect(table('olympic-women')).toEqual([['w1', 1, 1, true]]);
  });

  it('Continental family (CONMEBOL men): C1 3 · C2 2 · C3 1 (never played); disputed C4 ineligible; other confederations empty', () => {
    expect(table('continental-conmebol-men')).toEqual([
      ['c1', 1, 3, true],
      ['c2', 2, 2, true],
      ['c3', 3, 1, true],
      ['c4', null, 0, false],
    ]);
    expect(table('continental-uefa-men')).toEqual([]);
  });

  it('whole squad (D05): appearing never changes the credit, only the tie-break', () => {
    const r = runRanking(football, 'world-cup-men', input);
    const reserve = r.entries.find((e) => e.competitorId === 'm3')!;
    expect(reserve).toMatchObject({ eligible: true, score: 1, metrics: { titles: 1, verifiedAppearances: 0 } });
    const replacement = runRanking(football, 'olympic-men', input).entries.find((e) => e.competitorId === 'o3')!;
    expect(replacement).toMatchObject({ eligible: true, score: 1, metrics: { verifiedAppearances: 0 } });
  });

  it('overview: total → World Cups → continental → Olympic, ties shared; ineligible entries keep input order', () => {
    const r = runRanking(football, 'overview', input);
    expect(r.entries.map((e) => [e.competitorId, e.rank, e.score])).toEqual([
      ['m1', 1, 3],
      ['w1', 2, 3],
      ['c1', 3, 3],
      ['m2', 4, 2],
      ['c2', 5, 2],
      ['o1', 6, 2],
      ['m3', 7, 1],
      ['w2', 7, 1],
      ['c3', 9, 1],
      ['o2', 10, 1],
      ['o3', 10, 1],
      ['m4', null, 0],
      ['w3', null, 0],
      ['c4', null, 0],
    ]);
    expect(r.entries.find((e) => e.competitorId === 'w1')!.metrics).toMatchObject({ worldCups: 2, olympicGolds: 1, continentalTitles: 0 });
  });
});
