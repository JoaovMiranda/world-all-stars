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
  'Disciplinas', 'confirmado', 'opcional', 'Rankings', 'Wikipedia, Liquipedia, TheSportsDB copiando de 1 a 4.', '—', '404', '!', 'https://', 'Elite', 'Continental', 'Local', 'Bronze', 'Hall of Fame', 'Wikipedia', 'Total', 'Status', 'Headline', 'Links', 'Link', '.',
]);
/**
 * Every string with letters identical to pt-BR is flagged in en and es, short ones included. Spanish shares many
 * words with Portuguese: ALLOWED_SAME_ES lists the ones that are correct Spanish as they are.
 */
const ALLOWED_SAME_ES = new Set([
  'Ranking calculado', 'Ranking publicado', 'Identificadores', 'Descartar', 'Identidades', 'Competidor', 'Créditos', 'Anteriores', 'empate',
  'globo', 'Resultados', 'título', 'títulos', 'Títulos', 'Míticos', 'Política de cookies', 'Todos', 'todos', 'Todas', 'Ver todas', 'Ver todos',
  'individual', 'Legacy score bruto', 'Métrica', 'Percentil', 'Tipo', 'Atletas', 'atletas', 'Atleta', 'sáb', 'dom',
  'Cancelar', 'Reinados por período', 'Reinados de título', 'Oculto', 'Ocultar', 'Autor', 'Forma comparada',
  'Idioma', 'Modo', 'Texto normalizado', 'Publicar', 'Responder', 'responder', 'Lista por idioma', 'Nota',
  'Nota interna', 'Protocolo', 'Motivo', 'Confirmar', 'Continuar', 'continuar', 'Antes de continuar',
  'Marcar como duplicada', 'De', 'Reabrir', 'Respondida', 'Documento', 'Perfil', 'Administrador', 'Ver perfil',
  'Ver atletas', 'Foto', 'Explorar', 'Duplicado', 'Duplicada', 'Comentar', 'comentar', 'Ficha', 'Verificado',
  'Verificados', 'Descartada', 'Descartadas', 'Descartados', 'Nacional', 'Mundial', 'País', 'campos',
  'Filtros de atletas', 'Marca', 'Empresa', 'Principal', 'Abrir', 'Circuito', 'Circuito privado', 'Liga',
  'Historiadores', 'Oficial', 'oficial', 'Organizador', 'Próximo', 'Próximos campeonatos', 'Derrotas', 'Empates',
  'Resultado', 'anual', 'bienal', 'irregular', 'Anterior', 'Solicitante', 'afiliada a', 'Extraído por IA',
  'Registro', 'Campo', 'Modelo', 'Parcial', 'Validados', 'Enviando…', 'Divergente', 'Uso', '(opcional)',
  'Sugerir atleta', 'Mítico', 'Mostrar', 'Votos', 'Promover a admin',
]);
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
        return !(locale === 'es' ? ALLOWED_SAME_ES : ALLOWED_SAME_EN).has(l.value) && /[a-zà-ú]{2}/i.test(l.value);
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
