import { describe, expect, it } from 'vitest';

import { splitSentences } from './sentence-split.helper';

describe('splitSentences', () => {
  it('splits on sentence punctuation followed by a capital, digit or opening mark', () => {
    expect(splitSentences('He won the cup. Then he retired! Did he return? "Never," he said. 2005 was his last year.')).toEqual([
      'He won the cup.',
      'Then he retired!',
      'Did he return?',
      '"Never," he said.',
      '2005 was his last year.',
    ]);
  });

  it('keeps abbreviations, initials, acronyms and decimals inside the sentence', () => {
    const text =
      'Ken Griffey Jr. played in St. Louis with shirt No. 24 for the U.S. national team. J. R. Smith ran the 100 m in 9.58 seconds, a record. He moved to Santos FC. He retired.';
    expect(splitSentences(text)).toEqual([
      'Ken Griffey Jr. played in St. Louis with shirt No. 24 for the U.S. national team.',
      'J. R. Smith ran the 100 m in 9.58 seconds, a record.',
      'He moved to Santos FC.',
      'He retired.',
    ]);
  });

  it('treats line breaks as boundaries, drops blank and heading lines, and returns exact substrings', () => {
    const text = 'Cafu is a Brazilian former footballer.\n\n== Club career ==\nHe joined Roma in 1997 (aged 27). He won Serie A in 2001\nHonours';
    const out = splitSentences(text);
    expect(out).toEqual(['Cafu is a Brazilian former footballer.', 'He joined Roma in 1997 (aged 27).', 'He won Serie A in 2001', 'Honours']);
    for (const s of out) expect(text.includes(s)).toBe(true);
  });

  it('splits after a closing parenthesis or quote and before an opening one', () => {
    expect(splitSentences('He scored twice (a record.) "It was great." (He later coached.)')).toEqual([
      'He scored twice (a record.)',
      '"It was great."',
      '(He later coached.)',
    ]);
  });

  it('returns nothing for empty text', () => {
    expect(splitSentences('  \n\n ')).toEqual([]);
  });
});
