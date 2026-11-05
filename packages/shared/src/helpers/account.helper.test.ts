import { describe, expect, it } from 'vitest';

import { anonymizedUserName } from './account.helper';

describe('anonymizedUserName', () => {
  it('builds a 4-digit pseudonym (doc 13)', () => {
    expect(anonymizedUserName(1234)).toBe('Usuário removido #1234');
    expect(anonymizedUserName(7)).toBe('Usuário removido #0007');
    expect(anonymizedUserName(1_700_000_012_345)).toBe('Usuário removido #2345');
  });
});
