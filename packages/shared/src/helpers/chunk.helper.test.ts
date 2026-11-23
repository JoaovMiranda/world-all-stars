import { describe, expect, it } from 'vitest';

import { chunk } from './chunk.helper';

describe('chunk', () => {
  it('splits into slices of the given size', () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunk([], 50)).toEqual([]);
    expect(chunk([1, 2], 50)).toEqual([[1, 2]]);
  });

  it('rejects a non-positive size', () => {
    expect(() => chunk([1], 0)).toThrow(RangeError);
    expect(() => chunk([1], 1.5)).toThrow(RangeError);
  });
});
