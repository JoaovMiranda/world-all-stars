// Every dictionary (defineMessages) has the same shape in pt-BR, en and es: same keys, same array lengths, same
// message-function arity, no empty strings, and translations that actually differ from the pt-BR source (except
// proper names, brands and words that are spelled the same: ALLOWED_SAME).
import * as shared from '@was/shared';
import { describe, expect, it } from 'vitest';

import type { DocumentContent } from '@/shared-ui/document-page-layout.component';

type Dict = Record<string, unknown>;
const isMessages = (v: unknown): v is Record<shared.Locale, unknown> & { __messages: true } => !!v && typeof v === 'object' && (v as Dict).__messages === true;

const modules = {
  ...import.meta.glob<Dict>('/src/**/*.const.ts', { eager: true }),
  '@was/shared': shared as unknown as Dict,
};
const dictionaries = Object.entries(modules).flatMap(([file, mod]) =>
  Object.entries(mod)
    .filter(([, v]) => isMessages(v))
    .map(([name, v]) => ({ name: `${file.replace('/src/', '')}#${name}`, messages: v as unknown as Record<shared.Locale, unknown> })),
);

/** Strings that are legitimately the same as pt-BR in a translation (brands, names, symbols, cognates). */
const ALLOWED_SAME = new Set([
  'World All Stars', 'Hall of Greats', 'Admin', 'Wikidata', 'Legal', 'Cookies', 'Majors', 'MVP', 'Ranking', 'OK', 'Log', 'Jobs', 'Tokens', 'Parser',
  'Wikipedia, Liquipedia, TheSportsDB copiando de 1 a 4.', '—', '404', '!', 'https://', 'Elite', 'Continental', 'Local', 'Bronze', 'Hall of Fame', 'Wikipedia', 'Total', 'Status', 'Headline', 'Links', 'Link', '.',
]);
/**
 * Spanish shares many words and short labels with Portuguese ("Atletas", "Motivo", "Ver perfil"): for es only phrases of
 * 4+ words identical to pt-BR are flagged (a sentence left untranslated); en is checked string by string.
 */
const ES_MIN_WORDS = 4;
const ALLOWED_SAME_EN = new Set(['individual', 'irregular', 'bronze', 'Total', 'Elite', 'Continental', 'Local', 'Bronze', 'Status', 'Headline', 'Links', 'Link', 'Ranking', 'Majors']);

interface Leaf {
  path: string;
  value: unknown;
}
const leaves = (value: unknown, path = ''): Leaf[] => {
  if (typeof value === 'string' || typeof value === 'function' || typeof value === 'number' || typeof value === 'boolean' || value === null) return [{ path, value }];
  if (Array.isArray(value)) return [{ path: `${path}[]`, value: value.length }, ...value.flatMap((v, i) => leaves(v, `${path}[${i}]`))];
  return Object.keys(value as Dict)
    .filter((k) => k !== '__messages')
    .sort()
    .flatMap((k) => leaves((value as Dict)[k], path ? `${path}.${k}` : k));
};
const shape = (value: unknown) => leaves(value).map((l) => `${l.path}:${typeof l.value === 'function' ? `fn/${(l.value as () => unknown).length}` : Array.isArray(l.value) ? 'arr' : typeof l.value === 'number' && l.path.endsWith('[]') ? `len/${l.value}` : typeof l.value}`);

describe('messages coverage (pt-BR, en, es)', () => {
  it('finds the dictionaries', () => {
    expect(dictionaries.length).toBeGreaterThanOrEqual(20);
  });

  describe.each(dictionaries)('$name', ({ messages }) => {
    const pt = messages['pt-BR'];
    it.each(['en', 'es'] as const)('%s has the same keys, array lengths and function arities as pt-BR', (locale) => {
      expect(shape(messages[locale])).toEqual(shape(pt));
    });
    it.each(shared.LOCALE_VALUES)('%s has no empty strings', (locale) => {
      const empty = leaves(messages[locale]).filter((l) => typeof l.value === 'string' && !l.value.trim());
      expect(empty.map((l) => l.path)).toEqual([]);
    });
    it.each(['en', 'es'] as const)('%s is actually translated', (locale) => {
      const ptLeaves = new Map(leaves(pt).map((l) => [l.path, l.value]));
      const same = leaves(messages[locale]).filter((l) => {
        if (typeof l.value !== 'string' || ptLeaves.get(l.path) !== l.value || ALLOWED_SAME.has(l.value)) return false;
        if (locale === 'es') return l.value.split(/\s+/).length >= ES_MIN_WORDS;
        return !ALLOWED_SAME_EN.has(l.value) && /[a-zà-ú]{3}/i.test(l.value);
      });
      expect(same.map((l) => `${l.path} = ${String(l.value)}`)).toEqual([]);
    });
  });
});

/** Same document structure in every language: section ids, block kinds, list/table sizes. */
const docShape = (doc: DocumentContent) =>
  doc.sections.map((s) => ({
    id: s.id,
    blocks: (s.blocks ?? []).map((b) => `${b.kind}${'items' in b ? `/${b.items.length}` : ''}${'rows' in b ? `/${b.rows.length}x${b.headers.length}` : ''}`),
  }));

describe('long documents (legal, criteria) per language', () => {
  const docs = Object.entries(modules).flatMap(([file, mod]) =>
    Object.entries(mod)
      .filter(([name]) => name.endsWith('_DOCS'))
      .map(([name, v]) => ({ name: `${file}#${name}`, byLocale: v as Record<shared.Locale, DocumentContent | Record<string, DocumentContent>> })),
  );
  it('finds them', () => expect(docs.length).toBeGreaterThanOrEqual(2));
  it.each(docs)('$name has the same structure in en and es', ({ byLocale }) => {
    const flat = (v: DocumentContent | Record<string, DocumentContent>) => ('sections' in v ? { doc: v as DocumentContent } : (v as Record<string, DocumentContent>));
    const pt = flat(byLocale['pt-BR']);
    for (const locale of ['en', 'es'] as const) {
      const other = flat(byLocale[locale]);
      expect(Object.keys(other).sort()).toEqual(Object.keys(pt).sort());
      for (const key of Object.keys(pt)) expect(docShape(other[key]!)).toEqual(docShape(pt[key]!));
    }
  });
});
