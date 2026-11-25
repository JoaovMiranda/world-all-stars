import { describe, expect, it } from 'vitest';

import { closestSpan, looseText, similarity } from './tolerant-match.helper';

const SOURCE =
  'Marcos Evangelista de Morais (born 7 June 1970), known as Cafu, is a Brazilian former professional footballer. He won the 1994–95 Copa do Brasil and the “Treble” with São Paulo.';

describe('tolerant comparison (T1.6 safety net)', () => {
  it('normalizes quotes, dashes, whitespace, punctuation and case', () => {
    expect(looseText('  The “Treble” —  1994–95 ')).toBe('the treble 1994 95');
    expect(looseText('the "treble" - 1994-95')).toBe('the treble 1994 95');
    expect(similarity('Known as  CAFU', 'known as Cafu')).toBe(1);
  });

  it('replaces a typographic variant by the exact source span', () => {
    expect(closestSpan('He won the 1994-95 Copa do Brasil and the "Treble"', SOURCE)).toBe('He won the 1994–95 Copa do Brasil and the “Treble”');
    expect(closestSpan('born 7 June 1970, known as Cafu', SOURCE)).toBe('(born 7 June 1970), known as Cafu');
  });

  it('accepts a single typo in a long quote (similarity ≥ 0.95) and returns the literal span', () => {
    const span = closestSpan('is a Brazilian former profesional footballer', SOURCE);
    expect(span).toBe('is a Brazilian former professional footballer.');
    expect(SOURCE.includes(span!)).toBe(true);
  });

  it('rejects paraphrases, changed facts and very short quotes', () => {
    expect(closestSpan('He won the 1996–97 Copa do Brasil', SOURCE)).toBeNull();
    expect(closestSpan('is a retired Brazilian football player', SOURCE)).toBeNull();
    expect(closestSpan('Cafu', SOURCE)).toBeNull();
  });
});
