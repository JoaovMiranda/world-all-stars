import { describe, expect, it } from 'vitest';

import { BANNED_WORDS_FIXTURE, SOURCES_FIXTURE } from '../test/moderation.fixture';
import { validateContact } from './contact-validation.helper';
import { validateSuggestion, type SuggestionDraft } from './suggestion-validation.helper';

const ctx = {
  bannedWords: BANNED_WORDS_FIXTURE,
  sources: SOURCES_FIXTURE,
  knownAthletes: [{ slug: 'pele', knownAs: 'Pelé', fullName: 'Edson Arantes do Nascimento' }],
};
const suggest = (draft: Partial<SuggestionDraft>) => validateSuggestion({ athleteName: '', urls: [], ...draft }, ctx);

describe('validateSuggestion (doc 21)', () => {
  it('empty suggestion asks for name and link', () => {
    const r = suggest({ urls: ['', '  '] });
    expect(r.ok).toBe(false);
    expect(Object.keys(r.errors).sort()).toEqual(['athleteName', 'urls']);
  });
  it('refuses an athlete already on the site (no accents/case) with the profile', () => {
    const r = suggest({ athleteName: 'pele', urls: ['https://en.wikipedia.org/wiki/Pel%C3%A9'] });
    expect(r.existing).toEqual({ slug: 'pele', knownAs: 'Pelé' });
    expect(r.errors.athleteName).toContain('Pelé');
    expect(suggest({ athleteName: 'EDSON ARANTES DO NASCIMENTO', urls: ['https://en.wikipedia.org/wiki/x'] }).existing?.slug).toBe('pele');
  });
  it('flags each bad link by index', () => {
    const r = suggest({ athleteName: 'Zé', urls: ['http://x.com', 'https://192.168.1.1', 'https://allsportdb.com/a', 'nope'] });
    expect(r.errors).toMatchObject({ 'urls.0': expect.any(String), 'urls.1': expect.any(String), 'urls.2': expect.any(String), 'urls.3': expect.any(String) });
    expect(r.errors.urls).toBeDefined(); // more than 3 links
  });
  it('refuses repeated links', () => {
    expect(suggest({ athleteName: 'Zé', urls: ['https://en.wikipedia.org/wiki/Z', 'https://en.wikipedia.org/wiki/Z'] }).errors.urls).toBeDefined();
  });
  it('accepts BoxRec with both notes (reference only; no Wikipedia)', () => {
    const r = suggest({ athleteName: 'Éder Jofre', urls: ['https://boxrec.com/en/proboxer/1'] });
    expect(r.ok).toBe(true);
    expect(r.notes).toHaveLength(2);
  });
  it('validates optional why and email', () => {
    const r = suggest({ athleteName: 'Zé', urls: ['https://en.wikipedia.org/wiki/Z'], why: 'é um idiota', email: 'x@' });
    expect(Object.keys(r.errors).sort()).toEqual(['email', 'why']);
    expect(suggest({ athleteName: 'Zé', urls: ['https://en.wikipedia.org/wiki/Z'], why: 'a'.repeat(501) }).errors.why).toBeDefined();
    expect(suggest({ athleteName: 'Zé', urls: ['https://en.wikipedia.org/wiki/Z'], why: '   ', email: '' }).ok).toBe(true);
  });
});

describe('validateContact (doc 21)', () => {
  const ok = { name: 'Ana', email: 'ana@example.com', topic: 'press', body: 'Olá, curadoria!' };
  it('accepts a valid message', () => expect(validateContact(ok, BANNED_WORDS_FIXTURE)).toEqual({ ok: true, errors: {} }));
  it('refuses empty, whitespace-only, too long and banned bodies', () => {
    expect(validateContact({ ...ok, body: '' }, BANNED_WORDS_FIXTURE).errors.body).toBeDefined();
    expect(validateContact({ ...ok, body: ' ​  ' }, BANNED_WORDS_FIXTURE).errors.body).toBeDefined();
    expect(validateContact({ ...ok, body: 'x'.repeat(1001) }, BANNED_WORDS_FIXTURE).errors.body).toBeDefined();
    expect(validateContact({ ...ok, body: 'que merda de site' }, BANNED_WORDS_FIXTURE).errors.body).toBeDefined();
  });
  it('requires name, valid e-mail and a known topic', () => {
    const r = validateContact({ name: ' ', email: 'nope', topic: 'x', body: 'ok' }, BANNED_WORDS_FIXTURE);
    expect(Object.keys(r.errors).sort()).toEqual(['email', 'name', 'topic']);
  });
});
