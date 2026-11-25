const CREATIVE_COMMONS = /^CC[ -](BY(?:-(?:SA|NC|ND))*)[ -](\d\.\d)$/i;

/**
 * Canonical URL of a media license as Commons writes it ("CC BY-SA 4.0" → creativecommons.org/licenses/by-sa/4.0/,
 * "CC0" → the CC0 deed). Other names (public domain notices, local terms) fall back to `fallback` (the file page,
 * which states the license), else null.
 */
export const licenseUrl = (license: string | null | undefined, fallback: string | null = null): string | null => {
  const name = (license ?? '').trim();
  if (/^CC0(\s*1\.0)?$/i.test(name)) return 'https://creativecommons.org/publicdomain/zero/1.0/';
  const cc = CREATIVE_COMMONS.exec(name);
  if (cc) return `https://creativecommons.org/licenses/${cc[1]!.toLowerCase()}/${cc[2]}/`;
  return fallback;
};
