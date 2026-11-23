import { describe, expect, it } from 'vitest';

import { groupBy, indexById, uniqueBy } from './collection.helper';

const rows = [
  { id: 'a', sport: 'football' },
  { id: 'b', sport: 'bjj' },
  { id: 'c', sport: 'football' },
];

describe('collection helpers', () => {
  it('groups by key in insertion order', () => {
    expect([...groupBy(rows, (r) => r.sport)]).toEqual([
      ['football', [rows[0], rows[2]]],
      ['bjj', [rows[1]]],
    ]);
  });

  it('indexes by id', () => {
    const map = indexById(rows);
    expect(map.get('b')).toBe(rows[1]);
    expect(map.size).toBe(3);
  });

  it('keeps the first item per key', () => {
    expect(uniqueBy(rows, (r) => r.sport).map((r) => r.id)).toEqual(['a', 'b']);
  });
});
