// Hand-computed goldens for the chess methodology (METHODOLOGY.md §Examples 1–3).
import { describe, expect, it } from 'vitest';

import { runRanking } from '../../core/engine.helper';
import { evidenceOf, loadRankingFixture } from '../../helpers/fixture.helper';
import type { RankingEvidence } from '../../core/ranking-evidence.interface';
import { computeChessScore } from './chess-classical.helper';
import { ChessClassicalMethodology } from './chess-classical.methodology';

const chess = new ChessClassicalMethodology();
let seq = 0;
const ev = (competitorId: string, kind: string, attributes: Record<string, string | number>): RankingEvidence => ({
  id: `c${++seq}`,
  version: 1,
  kind,
  competitorId,
  attributes,
});
// Offline fixture: test-fixtures/chess-classical/examples.json (a = example 1, b = example 2, c = example 3).
const input = loadRankingFixture('chess-classical', 'examples');
const a = evidenceOf(input, 'a');
const b = evidenceOf(input, 'b');
const c = evidenceOf(input, 'c');

describe('chess methodology v1', () => {
  it('hand-computed totals: 54, 22 and 9', () => {
    expect(computeChessScore(a, chess.defaultConfig).score).toBe(54);
    expect(computeChessScore(b, chess.defaultConfig).score).toBe(22);
    expect(computeChessScore(c, chess.defaultConfig).score).toBe(9);
  });

  it('overall ranking orders by score and exposes the breakdown', () => {
    const r = runRanking(chess, 'overall', input);
    expect(r.entries.map((e) => [e.competitorId, e.rank, e.score])).toEqual([
      ['a', 1, 54],
      ['b', 2, 22],
      ['c', 3, 9],
    ]);
    expect(r.entries[0]!.metrics).toMatchObject({ classicalTitles: 3, rapidTitles: 1, blitzTitles: 0, peakRating: 2850, yearsAsNumberOne: 5 });
  });

  it('classical ranking ignores blitz-only careers', () => {
    const r = runRanking(chess, 'format-classical', input, {});
    const by = Object.fromEntries(r.entries.map((e) => [e.competitorId, e]));
    expect(by.a).toMatchObject({ score: 50, eligible: true });
    expect(by.b).toMatchObject({ score: 22, eligible: true });
    expect(by.c!.eligible).toBe(false);
  });

  it('format-agnostic rows count in every scope', () => {
    const agnostic = [ev('x', 'chess_rating', { rating: 2750, year: 1999 })];
    expect(computeChessScore(agnostic, chess.defaultConfig, 'classical').metrics.peakRating).toBe(2750);
    expect(computeChessScore(agnostic, chess.defaultConfig, 'blitz').metrics.peakRating).toBe(2750);
  });
});
