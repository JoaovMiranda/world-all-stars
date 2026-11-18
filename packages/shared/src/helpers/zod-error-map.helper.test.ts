import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { zodErrorMap } from './zod-error-map.helper';

const Schema = z.object({
  name: z.string().min(1),
  bio: z.string().min(3).max(5),
  email: z.email(),
  tier: z.enum(['gold', 'silver']),
  adult: z.literal(true),
  links: z.array(z.string()).max(1),
  own: z.string().refine((v) => v === 'ok', 'Mensagem própria do schema'),
});
const input = { bio: 'ab', email: 'x', tier: 'iron', adult: false, links: ['a', 'b'], own: 'no' };
const messages = (locale: 'pt-BR' | 'en' | 'es') => {
  const result = Schema.safeParse(input, { error: zodErrorMap(locale) });
  return Object.fromEntries((result.error?.issues ?? []).map((i) => [i.path.join('.'), i.message]));
};

describe('zodErrorMap', () => {
  it('translates the generic schema messages (en)', () => {
    expect(messages('en')).toEqual({
      name: 'Required field.',
      bio: 'Use at least 3 characters.',
      email: 'Invalid email address.',
      tier: 'Choose one of the options.',
      adult: 'Check this box to continue.',
      links: 'Choose at most 1.',
      own: 'Mensagem própria do schema',
    });
  });

  it('translates the generic schema messages (es), pt-BR by default', () => {
    expect(messages('es')).toMatchObject({ name: 'Campo obligatorio.', bio: 'Usa al menos 3 caracteres.', email: 'Correo electrónico no válido.', tier: 'Elige una de las opciones.' });
    expect(messages('pt-BR')).toMatchObject({ name: 'Campo obrigatório.', bio: 'Use pelo menos 3 caracteres.' });
    expect(z.string().max(2).safeParse('abc', { error: zodErrorMap() }).error?.issues[0]?.message).toBe('Use no máximo 2 caracteres.');
  });
});
