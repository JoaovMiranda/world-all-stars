const query = (params: Record<string, string>): string => new URLSearchParams(params).toString();

/** `https://<lang>.wikipedia.org/w/api.php?<params>` (MediaWiki Action API). */
export const wikipediaApiUrl = (lang: string, params: Record<string, string>): string => `https://${lang}.wikipedia.org/w/api.php?${query(params)}`;

/** Article URL of `title` (spaces become underscores, the rest percent-encoded). */
export const wikipediaPageUrl = (lang: string, title: string): string => `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replaceAll(' ', '_'))}`;

/** Article title of a `…/wiki/<Title>` URL ("Pel%C3%A9_(footballer)" → "Pelé (footballer)"); `null` when it has none. */
export const wikipediaTitleFromUrl = (url: string): string | null => {
  const raw = url.split('/wiki/')[1]?.split(/[?#]/)[0];
  if (!raw) return null;
  try {
    return decodeURIComponent(raw).replaceAll('_', ' ');
  } catch {
    return null;
  }
};

/** `https://www.wikidata.org/w/api.php?<params>`. */
export const wikidataApiUrl = (params: Record<string, string>): string => `https://www.wikidata.org/w/api.php?${query(params)}`;

/** Public page of a Wikidata item (`Q…`). */
export const wikidataEntityUrl = (qid: string): string => `https://www.wikidata.org/wiki/${qid}`;

/** `https://commons.wikimedia.org/w/api.php?<params>`. */
export const commonsApiUrl = (params: Record<string, string>): string => `https://commons.wikimedia.org/w/api.php?${query(params)}`;
