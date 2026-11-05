import { describe, expect, it } from 'vitest';

import { jsonPatchDiff } from './json-diff.helper';

describe('jsonPatchDiff', () => {
  it('lists added, replaced and removed fields', () => {
    expect(jsonPatchDiff({ a: 1, b: { x: 1 }, c: 3 }, { a: 1, b: { x: 2 }, d: 4 })).toEqual([
      { op: 'replace', path: '/b', value: { x: 2 } },
      { op: 'add', path: '/d', value: 4 },
      { op: 'remove', path: '/c' },
    ]);
  });
  it('treats null before as creation', () => {
    expect(jsonPatchDiff(null, { a: 1 })).toEqual([{ op: 'add', path: '/a', value: 1 }]);
  });
});
