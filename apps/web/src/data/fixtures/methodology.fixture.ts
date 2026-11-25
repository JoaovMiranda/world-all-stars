import { CONTENT_SOURCE_LOCALE, type MethodologyDocResponse, parseMarkdown } from '@was/shared';

import { ApiError } from '../api-error.error';
import { FIXTURE_METHODOLOGY_SOURCES } from './methodology-fixture.const';

/**
 * GET /api/ranking-methodologies/:key in fixture mode: same parser as the server, English source only. The web app does
 * not depend on @was/ranking, so the version comes from the document's `key@version` mention and the ranking list is
 * empty (the server fills both from the methodology registry).
 */
export const buildMethodologyDoc = (key: string): MethodologyDocResponse => {
  const source = Object.hasOwn(FIXTURE_METHODOLOGY_SOURCES, key) ? FIXTURE_METHODOLOGY_SOURCES[key] : undefined;
  if (source === undefined) throw new ApiError(404, { error: 'not_found' });
  const doc = parseMarkdown(source);
  return {
    key,
    version: new RegExp(`${key}@([\\w.]+)`).exec(source)?.[1] ?? '1',
    sport: null,
    rankings: [],
    title: doc.title ?? key,
    blocks: doc.blocks,
    contentLocale: CONTENT_SOURCE_LOCALE,
  };
};
