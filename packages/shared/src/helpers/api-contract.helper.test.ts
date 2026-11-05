import { describe, expect, it } from 'vitest';

import { AthleteFiltersSchema } from '../schemas/athlete-filters.schema';
import { createCommentInputSchema } from '../schemas/comment.schema';
import { createSuggestionInputSchema } from '../schemas/contact.schema';
import { BANNED_WORDS_FIXTURE, SOURCES_FIXTURE } from '../test/moderation.fixture';
import { buildApiPath, buildQueryString } from './api-contract.helper';

describe('api contract helpers', () => {
  it('builds paths and query strings', () => {
    expect(buildApiPath('/api/athletes/:slug/comments', { slug: 'mike tyson' })).toBe('/api/athletes/mike%20tyson/comments');
    expect(() => buildApiPath('/api/athletes/:slug', {})).toThrow();
    expect(buildQueryString({ q: 'pelé', tier: undefined, sport: '', slugs: ['a', 'b'] })).toBe('?q=pel%C3%A9&slugs=a%2Cb');
    expect(buildQueryString({})).toBe('');
  });
});

describe('shared Zod schemas', () => {
  it('URL filters drop invalid or empty values instead of failing', () => {
    expect(AthleteFiltersSchema.parse({ q: '  ', tier: 'god', sport: 'futebol' })).toEqual({ sport: 'futebol' });
  });
  it('comment input schema reports the shared rule on `body`', () => {
    const r = createCommentInputSchema(BANNED_WORDS_FIXTURE).safeParse({ body: 'M3RDA' });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.path).toEqual(['body']);
  });
  it('suggestion input schema maps field errors to paths', () => {
    const schema = createSuggestionInputSchema({ bannedWords: BANNED_WORDS_FIXTURE, sources: SOURCES_FIXTURE, knownAthletes: [] });
    const r = schema.safeParse({ athleteName: 'Zé', urls: ['http://x.com'] });
    expect(r.error?.issues.map((i) => i.path)).toEqual([['urls', 0]]);
  });
});
