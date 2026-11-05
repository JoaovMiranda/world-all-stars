import { describe, expect, it } from 'vitest';

import { canonicalizeForModeration, cleanText, codePointLength, includesNormalized, normalizeForSearch } from './text-normalize.helper';

describe('text normalization', () => {
  it('removes accents and case for search', () => {
    expect(normalizeForSearch('  Pelé ')).toBe('pele');
    expect(normalizeForSearch('HAKUHŌ Shō')).toBe('hakuho sho');
    expect(includesNormalized('Édson Arantes do Nascimento', 'edson')).toBe(true);
  });

  it('undoes leetspeak and collapses repeated letters', () => {
    expect(canonicalizeForModeration('M3RDAAA')).toBe('merda');
    expect(canonicalizeForModeration('p0rra')).toBe('pora');
    expect(canonicalizeForModeration('caralhooo')).toBe('caralho');
    expect(canonicalizeForModeration('$h1t')).toBe('shit');
    expect(canonicalizeForModeration('@rrombado')).toBe('arombado');
  });

  it('cleans invisible chars and exotic spaces', () => {
    expect(cleanText('​⁠﻿')).toBe('');
    expect(cleanText('  　 a b \r\n')).toBe('a b');
    expect(cleanText('x\r\ny')).toBe('x\ny');
    expect(cleanText(null)).toBe('');
  });

  it('counts code points (emoji = 1)', () => {
    expect(codePointLength('⚽🏆')).toBe(2);
    expect(codePointLength('abc')).toBe(3);
  });
});
