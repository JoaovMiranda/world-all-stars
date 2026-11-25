import { describe, expect, it } from 'vitest';

import { numberCorpus, resolveEvidence } from './numbered-corpus.helper';

const SOURCE = 'Pelé was a Brazilian forward. He won the FIFA World Cup in 1958, 1962 and 1970.\n== Club career ==\nHe played for Santos.';

describe('numbered corpus (citations by index)', () => {
  const corpus = numberCorpus(SOURCE, 'born 1940-10-23; titles: FIFA World Cup 1958, FIFA World Cup 1962');

  it('numbers SOURCE sentences and FACTS separately', () => {
    expect(corpus.ids).toEqual(['S1', 'S2', 'S3', 'F1', 'F2']);
    expect(corpus.source).toBe('[S1] Pelé was a Brazilian forward.\n[S2] He won the FIFA World Cup in 1958, 1962 and 1970.\n[S3] He played for Santos.');
    expect(corpus.facts).toBe('[F1] born 1940-10-23\n[F2] titles: FIFA World Cup 1958, FIFA World Cup 1962');
  });

  it('keeps whole sentences up to maxChars (at least one)', () => {
    expect(numberCorpus(SOURCE, '', 60).ids).toEqual(['S1']);
    expect(numberCorpus('A very long single sentence without any end', '', 5).ids).toEqual(['S1']);
    expect(numberCorpus('', '').facts).toBe('(none)');
  });

  it('resolves sentence IDs to the exact sentence; unknown IDs resolve to nothing', () => {
    expect(resolveEvidence(corpus, 'S2')).toEqual({ id: 'S2', quote: 'He won the FIFA World Cup in 1958, 1962 and 1970.' });
    expect(resolveEvidence(corpus, ' [F1] ')).toEqual({ id: 'F1', quote: 'born 1940-10-23' });
    expect(resolveEvidence(corpus, 'S9')).toEqual({ id: 'S9', quote: null });
  });

  it('resolves a quote text through the tolerant comparison', () => {
    expect(resolveEvidence(corpus, 'he won the FIFA World Cup in 1958, 1962, and 1970')).toEqual({
      id: null,
      quote: 'He won the FIFA World Cup in 1958, 1962 and 1970.',
    });
    expect(resolveEvidence(corpus, 'he won five World Cups with Brazil').quote).toBeNull();
  });
});
