// Hand-computed goldens for the Olympic medals methodology (METHODOLOGY.md §Examples 1–3).
import { describe, expect, it } from 'vitest';

import { runRanking } from '../../core/engine.helper';
import { evidenceOf, loadRankingFixture } from '../../helpers/fixture.helper';
import { computeOlympicMedalScore, olympicMedalTable } from './olympic-medals.helper';
import { OlympicMedalsMethodology } from './olympic-medals.methodology';

const olympic = new OlympicMedalsMethodology();
// Offline fixture: test-fixtures/olympic-medals/examples.json (a = example 1, b = example 2, c = example 3).
const input = loadRankingFixture('olympic-medals', 'examples');
const a = evidenceOf(input, 'a');
const b = evidenceOf(input, 'b');
const c = evidenceOf(input, 'c');

describe('olympic medals methodology v1', () => {
  it('hand-computed totals and breakdown', () => {
    expect(computeOlympicMedalScore(a, olympic.defaultConfig)).toMatchObject({ score: 9, metrics: { gold: 2, silver: 1, bronze: 1, medals: 4, sports: 3 } });
    expect(computeOlympicMedalScore(b, olympic.defaultConfig).score).toBe(4);
    expect(computeOlympicMedalScore(c, olympic.defaultConfig).score).toBe(1);
  });

  it('overall ranking orders by weighted total, then golds', () => {
    const r = runRanking(olympic, 'overall', input);
    expect(r.entries.map((e) => [e.competitorId, e.rank, e.score])).toEqual([
      ['a', 1, 9],
      ['b', 2, 4],
      ['c', 3, 1],
    ]);
  });

  it('per-sport rankings isolate their sport', () => {
    const swimming = runRanking(olympic, 'sport-swimming', input, { sports: ['swimming'] });
    expect(swimming.entries.map((e) => [e.competitorId, e.score, e.eligible])).toEqual([
      ['a', 5, true],
      ['b', 4, true],
      ['c', 0, false],
    ]);
    const athletics = runRanking(olympic, 'sport-athletics', input, { sports: ['athletics'] });
    expect(athletics.entries.filter((e) => e.eligible)).toHaveLength(1);
    expect(athletics.entries.find((e) => e.competitorId === 'a')).toMatchObject({ score: 1 });
  });

  it('medal table is a classification by NOC (gold, silver, bronze, NOC)', () => {
    expect(olympicMedalTable(input.evidence)).toEqual([
      { noc: 'BRA', gold: 2, silver: 1, bronze: 2, total: 5 },
      { noc: 'USA', gold: 0, silver: 2, bronze: 0, total: 2 },
    ]);
    expect(olympicMedalTable(input.evidence, { year: 2012 }).map((r) => r.noc)).toEqual(['BRA', 'USA']);
  });

  it('team medals can be excluded by the ruleset', () => {
    const noTeams = olympic.parseConfig({ teamMedalCreditsMembers: false });
    expect(computeOlympicMedalScore(a, noTeams).score).toBe(6);
  });
});
