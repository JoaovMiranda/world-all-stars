import { describe, expect, it } from 'vitest';

import { legacyUrlRedirect } from './legacy-url.helper';

const redirect = (pathAndQuery: string) => legacyUrlRedirect(new URL(pathAndQuery, 'http://localhost'));

describe('legacy (Portuguese) page URLs → English (D35)', () => {
  it.each([
    ['visao-geral', 'overview'],
    ['conquistas', 'achievements'],
    ['carreira', 'career'],
    ['analise', 'analysis'],
    ['fontes', 'sources'],
    ['comentarios', 'comments'],
  ])('athlete tab %s → %s', (old, next) => {
    expect(redirect(`/athletes/pele?tab=${old}`)).toBe(`/athletes/pele?tab=${next}`);
  });

  it.each([
    ['sugestao', 'suggestion'],
    ['mensagem', 'message'],
  ])('contact ?tipo=%s → ?type=%s', (old, next) => {
    expect(redirect(`/contact?tipo=${old}`)).toBe(`/contact?type=${next}`);
  });

  it.each([
    ['nao-lidas', 'unread'],
    ['lidas', 'read'],
  ])('notifications ?filtro=%s → ?filter=%s', (old, next) => {
    expect(redirect(`/me/notifications?filtro=${old}`)).toBe(`/me/notifications?filter=${next}`);
  });

  it('renames an old key even when its value is already English or unknown', () => {
    expect(redirect('/contact?tipo=message')).toBe('/contact?type=message');
    expect(redirect('/me/notifications?filtro=x')).toBe('/me/notifications?filter=x');
  });

  it('renames the old organizer slug in a path segment', () => {
    expect(redirect('/organizations/organizador-nao-informado')).toBe('/organizations/organizer-not-informed');
  });

  it('keeps the other query parameters and their order', () => {
    expect(redirect('/athletes/pele?compare=garrincha&tab=comentarios&sort=top')).toBe('/athletes/pele?compare=garrincha&tab=comments&sort=top');
  });

  it('drops the old key when the new one is already in the URL', () => {
    expect(redirect('/contact?tipo=mensagem&type=suggestion')).toBe('/contact?type=suggestion');
  });

  it('leaves current URLs and other pages alone', () => {
    expect(redirect('/athletes/pele?tab=comments')).toBeNull();
    expect(redirect('/contact?type=message')).toBeNull();
    expect(redirect('/me/notifications')).toBeNull();
    expect(redirect('/sports/football?tab=comentarios')).toBeNull();
    expect(redirect('/search?tipo=mensagem')).toBeNull();
  });
});
