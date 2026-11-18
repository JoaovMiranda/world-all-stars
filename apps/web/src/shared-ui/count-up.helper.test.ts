import { describe, expect, it } from 'vitest';

import { countAt, countDuration, decimalsOf, easeOutExpo } from './count-up.helper';

describe('count-up helper', () => {
  it('eases from 0 to 1 and ends exactly on the target', () => {
    expect(easeOutExpo(0)).toBe(0);
    expect(easeOutExpo(1)).toBe(1);
    expect(countAt(1, 1279)).toBe(1279);
    expect(countAt(0, 1279)).toBe(0);
  });

  it('moves fast first (most of the way by 40%)', () => {
    expect(countAt(0.4, 100)).toBeGreaterThan(90);
  });

  it('keeps whole numbers whole and the decimals of the target', () => {
    expect(Number.isInteger(countAt(0.3, 77))).toBe(true);
    expect(decimalsOf(4.5)).toBe(1);
    expect(decimalsOf(12)).toBe(0);
    expect(String(countAt(0.5, 4.5))).toMatch(/^\d(\.\d)?$/);
  });

  it('gives bigger numbers a longer (but capped) count', () => {
    expect(countDuration(3)).toBeLessThan(countDuration(1279));
    expect(countDuration(10_000_000)).toBe(1100);
  });
});
