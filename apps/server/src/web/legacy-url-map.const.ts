import type { LegacyQueryRename } from './legacy-query-rename.interface';

/**
 * D35: page URLs used Portuguese query keys and values; the English ones replace them and an old URL answers 301
 * (legacy-url.helper.ts). Kept for good: shared links and search engines still carry the old values.
 */
export const LEGACY_QUERY_RENAMES: readonly LegacyQueryRename[] = [
  {
    path: /^\/athletes\/[^/]+$/,
    key: 'tab',
    values: {
      'visao-geral': 'overview',
      conquistas: 'achievements',
      carreira: 'career',
      analise: 'analysis',
      fontes: 'sources',
      comentarios: 'comments',
    },
  },
  { path: /^\/contact$/, key: 'tipo', to: 'type', values: { sugestao: 'suggestion', mensagem: 'message' } },
  { path: /^\/me\/notifications$/, key: 'filtro', to: 'filter', values: { 'nao-lidas': 'unread', lidas: 'read' } },
];

/**
 * Old → new path segment of any page. The placeholder organizer is not stored by the current seed data; when it is,
 * scripts/fixtures/english-slugs.mjs stores the English slug and a slug_redirects row from the old one.
 */
export const LEGACY_PATH_SEGMENTS: Readonly<Record<string, string>> = {
  'organizador-nao-informado': 'organizer-not-informed',
};
