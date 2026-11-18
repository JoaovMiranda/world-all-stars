import { describe, expect, it } from 'vitest';

import { createFormatters } from './formatters.helper';
import { matchLocale, negotiateLocale, resolveLocale } from './locale.helper';
import { defineMessages, textFor } from './messages.helper';

describe('negotiateLocale', () => {
  it('picks the highest q-value that is supported', () => {
    expect(negotiateLocale('fr-FR,fr;q=0.9,en;q=0.8,pt;q=0.7')).toBe('en');
    expect(negotiateLocale('es;q=0.5, pt-BR;q=0.9')).toBe('pt-BR');
  });
  it('maps regional variants to the supported language', () => {
    expect(negotiateLocale('pt-PT')).toBe('pt-BR');
    expect(negotiateLocale('es-AR,es;q=0.9')).toBe('es');
    expect(negotiateLocale('en-GB')).toBe('en');
  });
  it('keeps the header order on ties and ignores q=0 and wildcards', () => {
    expect(negotiateLocale('es, en')).toBe('es');
    expect(negotiateLocale('en;q=0, es;q=0.1')).toBe('es');
    expect(negotiateLocale('*')).toBeNull();
  });
  it('returns null when nothing matches or the header is missing', () => {
    expect(negotiateLocale('de-DE,fr;q=0.8')).toBeNull();
    expect(negotiateLocale('')).toBeNull();
    expect(negotiateLocale(undefined)).toBeNull();
  });
});

describe('matchLocale', () => {
  it('accepts exact and language-only tags', () => {
    expect(matchLocale('pt-BR')).toBe('pt-BR');
    expect(matchLocale('EN_us')).toBe('en');
    expect(matchLocale('it')).toBeNull();
  });
});

describe('resolveLocale', () => {
  it('query → header → cookie → Accept-Language → pt-BR', () => {
    expect(resolveLocale({ query: 'es', header: 'en', cookie: 'pt-BR', acceptLanguage: 'en' })).toBe('es');
    expect(resolveLocale({ header: 'en', cookie: 'es' })).toBe('en');
    expect(resolveLocale({ cookie: 'es', acceptLanguage: 'en' })).toBe('es');
    expect(resolveLocale({ acceptLanguage: 'en-US,en;q=0.9' })).toBe('en');
    expect(resolveLocale({})).toBe('pt-BR');
  });
  it('ignores invalid explicit values', () => {
    expect(resolveLocale({ cookie: 'xx', header: 'EN', acceptLanguage: 'es' })).toBe('es');
  });
});

describe('defineMessages / textFor', () => {
  const M = defineMessages({ hi: 'Olá', n: (k: number) => `${k} itens` }, { en: { hi: 'Hi', n: (k) => `${k} items` }, es: { hi: 'Hola', n: (k) => `${k} elementos` } });
  it('returns the dictionary of each locale', () => {
    expect(textFor(M, 'pt-BR').hi).toBe('Olá');
    expect(textFor(M, 'en').n(2)).toBe('2 items');
    expect(textFor(M, 'es').hi).toBe('Hola');
  });
});

describe('createFormatters', () => {
  it('formats per locale and is memoized', () => {
    const pt = createFormatters('pt-BR');
    expect(pt).toBe(createFormatters('pt-BR'));
    expect(pt.date('1940-10-23')).toBe('23/10/1940');
    expect(createFormatters('en').date('1940-10-23')).toBe('10/23/1940');
    expect(pt.number(1279)).toBe('1.279');
    expect(createFormatters('en').number(1279)).toBe('1,279');
    expect(createFormatters('es').dayMonth('2026-10-23')).toBe('23 de octubre');
    expect(createFormatters('en').country('BR', '?')).toBe('Brazil');
    expect(pt.country('DE', '?')).toBe('Alemanha');
  });
  it('relative days and plural rules', () => {
    const now = new Date('2026-11-17T12:00:00Z');
    expect(createFormatters('en').relativeDay('2026-11-16T12:00:00Z', now)).toBe('yesterday');
    expect(createFormatters('pt-BR').relativeDay('2026-11-14T12:00:00Z', now)).toBe('há 3 dias');
    expect(createFormatters('en').plural(1)).toBe('one');
    expect(createFormatters('es').compare('árbol', 'Zeta')).toBeLessThan(0);
  });
});
