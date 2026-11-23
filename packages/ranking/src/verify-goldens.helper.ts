import { METHODOLOGIES } from './registry.const';
import type { GoldenCheck } from './golden-check.interface';
import { GOLDEN_HASHES, GOLDEN_INPUTS } from './goldens.const';

/**
 * Reproducibility gate of a methodology (T2.3): the recorded fixture must still produce the recorded output hash.
 * A methodology without a golden is never auto-published.
 */
export const verifyGoldens = (methodologyKey: string): GoldenCheck => {
  const golden = GOLDEN_INPUTS[methodologyKey];
  const expected = GOLDEN_HASHES[methodologyKey];
  const methodology = METHODOLOGIES[methodologyKey];
  if (!golden || !expected || !methodology) return { ok: false, rankingKey: golden?.rankingKey ?? '', expected: expected ?? '', actual: null };
  const result = methodology.calculate(golden.rankingKey, golden.input);
  return { ok: result.outputHash === expected, rankingKey: golden.rankingKey, expected, actual: result.outputHash };
};
