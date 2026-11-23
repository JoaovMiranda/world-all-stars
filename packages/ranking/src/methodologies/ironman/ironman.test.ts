// Hand-computed goldens for the Ironman methodology (METHODOLOGY.md §Examples 1–3).
import { describe, expect, it } from 'vitest';

import { runRanking } from '../../core/engine.helper';
import { evidenceOf, loadRankingFixture } from '../../helpers/fixture.helper';
import { computeIronmanScore } from './ironman.helper';
import { IronmanMethodology } from './ironman.methodology';

const ironman = new IronmanMethodology();
// Offline fixture: test-fixtures/ironman/examples.json (a = example 1, b = example 2, c = example 3).
const input = loadRankingFixture('ironman', 'examples');
const a = evidenceOf(input, 'a');
const b = evidenceOf(input, 'b');
const c = evidenceOf(input, 'c');

describe('ironman methodology v1', () => {
  it('hand-computed totals: 38, 16 and 10', () => {
    expect(computeIronmanScore(a, ironman.defaultConfig).score).toBe(38);
    expect(computeIronmanScore(b, ironman.defaultConfig).score).toBe(16);
    expect(computeIronmanScore(c, ironman.defaultConfig).score).toBe(10);
  });

  it('overall ranking orders by score and exposes the breakdown', () => {
    const r = runRanking(ironman, 'overall', input);
    expect(r.entries.map((e) => [e.competitorId, e.rank, e.score])).toEqual([
      ['a', 1, 38],
      ['b', 2, 16],
      ['c', null, 10],
    ]);
    expect(r.entries[0]!.metrics).toMatchObject({ worldTitles: 3, podiums: 1, courseRecords: 1 });
  });

  it('the championship ranking only counts championship results', () => {
    const r = runRanking(ironman, 'event-ironman-world-championship', input);
    const by = Object.fromEntries(r.entries.map((e) => [e.competitorId, e]));
    expect(by.a).toMatchObject({ score: 33, rank: 1 });
    expect(by.b!.score).toBe(16);
    expect(by.c!.eligible).toBe(false);
  });

  it('is reproducible: same evidence ⇒ same output hash', () => {
    const r1 = runRanking(ironman, 'overall', input);
    const r2 = runRanking(ironman, 'overall', { competitors: [...input.competitors].reverse(), evidence: [...input.evidence].reverse() });
    expect(r2.outputHash).toBe(r1.outputHash);
  });
});
