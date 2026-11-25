import { describe, expect, it } from 'vitest';

import { canonicalQuery } from './canonical-query.helper';

describe('canonicalQuery', () => {
  it('keeps filters in a stable order and drops sort-only params, empty values and page 1', () => {
    expect(canonicalQuery({ sort: 'name', gi: 'no-gi', belt: 'black', page: 1, weight: '' }, ['sort'])).toBe('?belt=black&gi=no-gi');
    expect(canonicalQuery({ page: 3, absolute: true }, ['sort'])).toBe('?absolute=true&page=3');
  });

  it('is empty without content params', () => {
    expect(canonicalQuery({ sort: 'name' }, ['sort'])).toBe('');
  });
});
