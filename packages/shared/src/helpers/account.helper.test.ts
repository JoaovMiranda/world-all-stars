import { describe, expect, it } from 'vitest';

import { accountDeleteConfirmationError, accountDeleteWord, anonymizedUserName } from './account.helper';

describe('anonymizedUserName', () => {
  it('builds a 4-digit pseudonym (doc 13)', () => {
    expect(anonymizedUserName(1234)).toBe('Usuário removido #1234');
    expect(anonymizedUserName(7)).toBe('Usuário removido #0007');
    expect(anonymizedUserName(1_700_000_012_345)).toBe('Usuário removido #2345');
  });
});

describe('account deletion confirmation word', () => {
  it('is one word per language, and only the request language word is accepted', () => {
    expect([accountDeleteWord('pt-BR'), accountDeleteWord('en'), accountDeleteWord('es')]).toEqual(['EXCLUIR', 'DELETE', 'ELIMINAR']);
    expect(accountDeleteConfirmationError(' DELETE ', 'en')).toBeNull();
    expect(accountDeleteConfirmationError('ELIMINAR', 'es')).toBeNull();
    expect(accountDeleteConfirmationError('EXCLUIR', 'en')).toBe('Type DELETE to confirm.');
    expect(accountDeleteConfirmationError('DELETE', 'es')).toBe('Escribe ELIMINAR para confirmar.');
    expect(accountDeleteConfirmationError('delete', 'en')).not.toBeNull();
  });
});
