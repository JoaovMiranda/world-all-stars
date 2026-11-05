import { describe, expect, it } from 'vitest';

import { isUuid, uuidv7 } from './uuid.helper';

describe('uuidv7', () => {
  it('is a valid v7 uuid', () => {
    const id = uuidv7();
    expect(isUuid(id)).toBe(true);
    expect(id[14]).toBe('7');
    expect(['8', '9', 'a', 'b']).toContain(id[19]);
  });
  it('sorts by creation time', () => {
    expect(uuidv7(1_000) < uuidv7(2_000)).toBe(true);
  });
});
