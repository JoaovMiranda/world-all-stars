import type { LocaleSources } from '../interfaces/locale-sources.interface';
import type { Locale } from '../types/locale.type';
import { DEFAULT_LOCALE, LOCALE_VALUES } from './locale.const';

export const isLocale = (value: unknown): value is Locale => LOCALE_VALUES.includes(value as Locale);

/** Maps any BCP 47 tag to a supported locale: exact match, then by language (pt-PT → pt-BR, es-AR → es, en-GB → en). */
export const matchLocale = (tag: string | null | undefined): Locale | null => {
  const clean = (tag ?? '').trim();
  if (!clean || clean === '*') return null;
  if (isLocale(clean)) return clean;
  const language = clean.split(/[-_]/)[0]?.toLowerCase();
  if (language === 'pt') return 'pt-BR';
  if (language === 'en') return 'en';
  if (language === 'es') return 'es';
  return null;
};

/**
 * Best supported locale for an `Accept-Language` header (RFC 9110 q-values, ties keep the header order).
 * Null when nothing matches (the caller falls back to the default).
 */
export const negotiateLocale = (acceptLanguage: string | null | undefined): Locale | null => {
  const ranges = (acceptLanguage ?? '')
    .split(',')
    .map((part, index) => {
      const [tag = '', ...params] = part.trim().split(';');
      const q = params.map((p) => p.trim()).find((p) => p.startsWith('q='));
      const weight = q ? Number(q.slice(2)) : 1;
      return { tag: tag.trim(), weight: Number.isFinite(weight) ? weight : 0, index };
    })
    .filter((r) => r.tag && r.weight > 0)
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const range of ranges) {
    const hit = matchLocale(range.tag);
    if (hit) return hit;
  }
  return null;
};

/** Locale of a request: query → header → cookie (explicit choices, exact values only) → Accept-Language → pt-BR. */
export const resolveLocale = ({ query, header, cookie, acceptLanguage }: LocaleSources): Locale => {
  for (const explicit of [query, header, cookie]) if (isLocale(explicit)) return explicit;
  return negotiateLocale(acceptLanguage) ?? DEFAULT_LOCALE;
};
