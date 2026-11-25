// Pure steps of the `sport-images` provider (T4.4): which Commons files a sport item offers (Wikidata P18) and which
// one may be shown (license CC0 / PD / CC BY / CC BY-SA, with author and file page for the attribution).
import type { SportImage, SportImageMiss } from '@was/db';
import { isFreeLicense, normalizeForSearch, type WikidataEntity, wikipediaTitleFromUrl } from '@was/shared';

import type { CommonsImageInfo } from '../interfaces/commons-image-info.interface';

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

/** Plain text of a Commons extmetadata value (HTML with links and entities); `null` when empty. */
export const htmlToText = (html: string | null | undefined): string | null => {
  if (!html) return null;
  const text = html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? Number.parseInt(e.slice(2), 16) : Number(e.slice(1)));
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/\s+/g, ' ')
    .trim();
  return text || null;
};

/** Longest author credit shown under an image; longer Commons texts (boilerplate, language lists) are cut. */
const AUTHOR_MAX = 120;

/** Author credit of a Commons file: the Artist (or Credit) text, without Commons boilerplate, at most AUTHOR_MAX chars. */
export const authorCredit = (artist: string | null | undefined, credit?: string | null): string | null => {
  const text = htmlToText(artist) ?? htmlToText(credit);
  if (!text) return null;
  const assumed = /^No machine-readable author provided\. (.+?) assumed\b/i.exec(text);
  const clean = assumed ? assumed[1]!.trim() : text;
  if (clean.length <= AUTHOR_MAX) return clean;
  const sentence = clean.slice(0, AUTHOR_MAX).lastIndexOf('. ');
  return sentence > 20 ? clean.slice(0, sentence + 1) : `${clean.slice(0, AUTHOR_MAX - 1).trimEnd()}…`;
};

/** Wikipedia title key (spaces, first letter upper case), to compare a catalog URL with a Wikidata sitelink. */
const titleKey = (title: string): string => commonsFileKey(title);

/** Wikipedia language and title of an article URL (`https://pt.wikipedia.org/wiki/Jud%C3%B4` → pt, decoded title). */
const articleOf = (url: string | null): { lang: string; title: string } | null => {
  const lang = url ? /^https:\/\/([a-z-]+)\.wikipedia\.org\/wiki\//.exec(url)?.[1] : undefined;
  const title = lang ? wikipediaTitleFromUrl(url!) : null;
  return lang && title ? { lang, title } : null;
};

/**
 * Whether the Wikidata item is the sport we mean. With a Wikipedia article and a sitelink in its language, the sitelink
 * must be that article; otherwise one of the item labels (en/pt/es) must match one of the sport names. Nothing to compare
 * counts as a match. A mismatch means a wrong QID: its image would show something else.
 */
export const itemMatchesSport = (entity: WikidataEntity | undefined, articleUrl: string | null, names: readonly string[]): boolean => {
  const article = articleOf(articleUrl);
  const sitelink = article ? entity?.sitelinks?.[`${article.lang}wiki`]?.title : undefined;
  if (article && sitelink) return titleKey(sitelink) === titleKey(article.title);
  const labels = Object.values(entity?.labels ?? {})
    .map((l) => normalizeForSearch(l.value))
    .filter(Boolean);
  const wanted = names.map((n) => normalizeForSearch(n)).filter(Boolean);
  if (labels.length === 0 || wanted.length === 0) return true;
  return labels.some((l) => wanted.some((n) => l.includes(n) || n.includes(l)));
};

/** What the item is (sitelink in the article's language, else its English label), shown when the QID looks wrong. */
export const itemName = (entity: WikidataEntity | undefined, articleUrl: string | null): string | null => {
  const article = articleOf(articleUrl);
  return (article && entity?.sitelinks?.[`${article.lang}wiki`]?.title) || entity?.labels?.en?.value || null;
};

/** Commons file key: spaces instead of underscores, first letter upper case (MediaWiki title normalization). */
export const commonsFileKey = (file: string): string => {
  const name = file
    .replace(/^File:/i, '')
    .replaceAll('_', ' ')
    .trim();
  return name.charAt(0).toUpperCase() + name.slice(1);
};

/** P18 (image) values of an item: preferred statements first, deprecated ones dropped. */
export const imageCandidates = (entity: WikidataEntity | undefined): string[] => {
  const statements = (entity?.claims?.P18 ?? []).filter((s) => s.rank !== 'deprecated');
  const ordered = [...statements.filter((s) => s.rank === 'preferred'), ...statements.filter((s) => s.rank !== 'preferred')];
  return [...new Set(ordered.map((s) => s.mainsnak.datavalue?.value).filter((v): v is string => typeof v === 'string' && v.length > 0))];
};

/** First candidate with a permitted license, or why the sport gets no image. */
export const pickSportImage = (
  sport: string,
  qid: string | null,
  candidates: readonly string[],
  infos: ReadonlyMap<string, CommonsImageInfo>,
): SportImage | SportImageMiss => {
  if (!qid) return { sport, qid, reason: 'no Wikidata item' };
  if (candidates.length === 0) return { sport, qid, reason: 'no image (P18) on the Wikidata item' };
  const refused: string[] = [];
  for (const file of candidates) {
    const info = infos.get(commonsFileKey(file));
    if (!info) {
      refused.push(`${file}: file metadata not found on Commons`);
      continue;
    }
    const meta = info.extmetadata ?? {};
    const license = htmlToText(meta.LicenseShortName?.value);
    if (!isFreeLicense(license)) {
      refused.push(`${file}: license not allowed (${license ?? 'unknown'})`);
      continue;
    }
    const year = /\b(1[89]\d\d|20\d\d)\b/.exec(htmlToText(meta.DateTimeOriginal?.value) ?? '')?.[1];
    return {
      sport,
      qid,
      file: commonsFileKey(file),
      url: info.url,
      thumbUrl: info.thumburl ?? info.url,
      page: info.descriptionurl,
      author: authorCredit(meta.Artist?.value, meta.Credit?.value),
      license: license!,
      licenseUrl: htmlToText(meta.LicenseUrl?.value),
      year: year ? Number(year) : null,
    };
  }
  return { sport, qid, reason: refused.join('; ') };
};

/** Type guard: a chosen image (not a miss). */
export const isSportImage = (r: SportImage | SportImageMiss): r is SportImage => 'file' in r;
