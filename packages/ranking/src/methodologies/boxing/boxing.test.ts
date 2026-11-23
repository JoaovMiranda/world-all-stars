// Hand-computed goldens for the boxing methodology (METHODOLOGY.md §Examples 1–3).
import { describe, expect, it } from 'vitest';

import { runRanking } from '../../core/engine.helper';
import { evidenceOf, loadRankingFixture } from '../../helpers/fixture.helper';
import { boxingDesignation } from './boxing.const';
import { computeBoxingScore } from './boxing.helper';
import { BoxingMethodology } from './boxing.methodology';

const boxing = new BoxingMethodology();
// Offline fixture: test-fixtures/boxing/examples.json (a = example 1, b = example 2, c = example 3).
const input = loadRankingFixture('boxing', 'examples');
const champion = evidenceOf(input, 'a');
const contender = evidenceOf(input, 'b');
const unified = evidenceOf(input, 'c');

describe('boxing methodology v1', () => {
  it('hand-computed totals: 45, 4 and 29 (METHODOLOGY.md)', () => {
    expect(computeBoxingScore(champion, boxing.defaultConfig).score).toBe(45);
    expect(computeBoxingScore(contender, boxing.defaultConfig).score).toBe(4);
    expect(computeBoxingScore(unified, boxing.defaultConfig).score).toBe(29);
  });

  it('designation follows the configured thresholds', () => {
    const config = boxing.defaultConfig;
    expect(boxingDesignation(45, config)).toBe('champion');
    expect(boxingDesignation(4, config)).toBe('contender');
    expect(boxingDesignation(80, config)).toBe('mythical');
    expect(boxingDesignation(50, config)).toBe('legendary');
  });

  it('open ranking orders by score and exposes the breakdown', () => {
    const r = runRanking(boxing, 'open', input);
    expect(r.entries.map((e) => [e.competitorId, e.rank, e.score])).toEqual([
      ['a', 1, 45],
      ['c', 2, 29],
      ['b', 3, 4],
    ]);
    expect(r.entries[0]!.metrics).toMatchObject({ titles: 3, defenses: 3, divisions: 2, olympicGold: 1 });
  });

  it('a division ranking requires a title in that division', () => {
    const r = runRanking(boxing, 'division-heavyweight', input, { divisions: ['heavyweight'] });
    const by = Object.fromEntries(r.entries.map((e) => [e.competitorId, e]));
    expect(by.a).toMatchObject({ rank: 1, eligible: true });
    expect(by.b!.eligible).toBe(false);
    expect(by.c!.eligible).toBe(false);
  });

  it('is reproducible: same evidence ⇒ same output hash', () => {
    const r1 = runRanking(boxing, 'open', input);
    const r2 = runRanking(boxing, 'open', { competitors: [...input.competitors].reverse(), evidence: [...input.evidence].reverse() });
    expect(r2.outputHash).toBe(r1.outputHash);
  });
});
