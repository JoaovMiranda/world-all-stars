import { INVISIBLE_CHARS_REGEX, LEET_MAP, WIDE_SPACES_REGEX } from '../consts/text-normalization.const';

/** Removes invisible chars, turns exotic spaces into plain ones, normalizes line breaks and trims (doc 20). */
export const cleanText = (raw: unknown): string =>
  String(raw ?? '')
    .replace(INVISIBLE_CHARS_REGEX, '')
    .replace(WIDE_SPACES_REGEX, ' ')
    .replace(/\r\n?/g, '\n')
    .trim();

/** Length in Unicode code points (an emoji counts 1). */
export const codePointLength = (text: string): number => [...text].length;

/** Search form: no accents, lower case, trimmed ("Pelé" → "pele"). Used by name search on BE and FE. */
export const normalizeForSearch = (text: unknown): string =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim();

/** Moderation form: search form + leetspeak undone + repeated letters collapsed ("M3RDAAA" → "merda"). */
export const canonicalizeForModeration = (text: unknown): string =>
  normalizeForSearch(text)
    .replace(/[013457@$]/g, (c) => LEET_MAP[c] ?? c)
    .replace(/(.)\1+/gu, '$1');

/** True when the (search-normalized) haystack contains the needle ("Pele" matches "Pelé"). */
export const includesNormalized = (haystack: unknown, needle: unknown): boolean =>
  normalizeForSearch(haystack).includes(normalizeForSearch(needle));
