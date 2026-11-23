import { LEGACY_PATH_SEGMENTS, LEGACY_QUERY_RENAMES } from './legacy-url-map.const';

/**
 * Path + query of the English URL for a page URL that still uses an old (Portuguese) query key, query value or path
 * segment, or null when the URL is current. Other query parameters and their order are kept; when the URL carries
 * both an old key and its new one, the new one wins.
 */
export const legacyUrlRedirect = (url: URL): string | null => {
  let changed = false;
  const path = url.pathname
    .split('/')
    .map((segment) => {
      const next = LEGACY_PATH_SEGMENTS[segment];
      if (next === undefined) return segment;
      changed = true;
      return next;
    })
    .join('/');
  const renames = LEGACY_QUERY_RENAMES.filter((r) => r.path.test(path));
  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    const rename = renames.find((r) => r.key === key);
    const nextKey = rename?.to ?? key;
    const nextValue = rename?.values[value] ?? value;
    if (nextKey === key && nextValue === value) {
      params.append(key, value);
      continue;
    }
    changed = true;
    if (nextKey === key || !url.searchParams.has(nextKey)) params.append(nextKey, nextValue);
  }
  if (!changed) return null;
  const search = params.toString();
  return `${path}${search ? `?${search}` : ''}`;
};
