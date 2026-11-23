import { describe, expect, it } from 'vitest';

import { commonsApiUrl, wikidataApiUrl, wikidataEntityUrl, wikipediaApiUrl, wikipediaPageUrl, wikipediaTitleFromUrl } from './wikimedia-url.helper';

describe('Wikimedia URL helpers', () => {
  it('builds Action API URLs', () => {
    expect(wikipediaApiUrl('en', { action: 'query', titles: 'Pelé|Garrincha' })).toBe(
      'https://en.wikipedia.org/w/api.php?action=query&titles=Pel%C3%A9%7CGarrincha',
    );
    expect(wikidataApiUrl({ action: 'wbgetentities', ids: 'Q12897' })).toBe('https://www.wikidata.org/w/api.php?action=wbgetentities&ids=Q12897');
    expect(commonsApiUrl({ action: 'query' })).toBe('https://commons.wikimedia.org/w/api.php?action=query');
    expect(wikidataEntityUrl('Q12897')).toBe('https://www.wikidata.org/wiki/Q12897');
  });

  it('round-trips article titles', () => {
    const url = wikipediaPageUrl('en', 'Pelé (footballer)');
    expect(url).toBe('https://en.wikipedia.org/wiki/Pel%C3%A9_(footballer)');
    expect(wikipediaTitleFromUrl(url)).toBe('Pelé (footballer)');
    expect(wikipediaTitleFromUrl('https://en.wikipedia.org/wiki/Garrincha#Career')).toBe('Garrincha');
    expect(wikipediaTitleFromUrl('https://example.org/page')).toBeNull();
    expect(wikipediaTitleFromUrl('https://en.wikipedia.org/wiki/%E0%A4%A')).toBeNull();
  });
});
