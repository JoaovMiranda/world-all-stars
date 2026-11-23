// Calibration sample (D01): labelled pairs (same person / different people). Thresholds must give ZERO automatic
// false positives and keep recall (auto + review) ≥ 0.95 on the sample. pnpm ingest:identity-eval prints the matrix.
import { describe, expect, it } from 'vitest';

import { IDENTITY_SAMPLE } from './identity-sample.const';
import { IDENTITY_THRESHOLDS } from './identity-thresholds.const';
import { decide, scoreCandidate } from './resolver';

describe('identity resolution calibration (D01)', () => {
  const results = IDENTITY_SAMPLE.map((s) => ({ ...s, score: scoreCandidate(s.query, s.candidate) }));
  const auto = (x: number) => x >= IDENTITY_THRESHOLDS.auto;
  const review = (x: number) => x >= IDENTITY_THRESHOLDS.review;

  it('has no automatic false positive (precision first)', () => {
    const fp = results.filter((r) => !r.same && auto(r.score));
    expect(fp.map((r) => r.label)).toEqual([]);
  });

  it('keeps recall ≥ 0.95 between automatic matches and the review queue', () => {
    const same = results.filter((r) => r.same);
    expect(same.filter((r) => review(r.score)).length / same.length).toBeGreaterThanOrEqual(0.95);
  });

  it('never merges on a name alone, and a second strong candidate forces review', () => {
    expect(
      scoreCandidate({ name: 'Ronaldo', externalIds: {}, sport: null }, { names: ['Ronaldo'], externalIds: {}, sports: ['football'], birthDate: null }),
    ).toBeLessThan(IDENTITY_THRESHOLDS.review);
    expect(
      decide([
        { entityId: 'a', confidence: 0.99, signals: [] },
        { entityId: 'b', confidence: 0.99, signals: [] },
      ]).kind,
    ).toBe('review');
  });
});
