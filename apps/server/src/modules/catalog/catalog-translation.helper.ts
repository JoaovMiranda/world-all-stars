import { groupBy, isLocale, type Locale } from '@was/shared';

import { FALLBACK_CHAIN } from './catalog.const';
import type { Translated } from './catalog-translated.type';

/**
 * Translation lookup of one translation table: requested locale, then pt-BR, then en, then any locale. `localeOf`
 * tells which language a record's text actually came in (the `contentLocale` of detail responses).
 */
export const translator = <X extends Translated>(rows: X[], parentKey: keyof X, locale: Locale) => {
  const index = groupBy(rows, (r) => r[parentKey] as string);
  const order = [locale, ...FALLBACK_CHAIN.filter((l) => l !== locale)];
  const pick = (id: string | null | undefined): X | undefined => {
    if (!id) return undefined;
    const list = index.get(id) ?? [];
    for (const l of order) {
      const hit = list.find((r) => r.locale === l);
      if (hit) return hit;
    }
    return list[0];
  };
  const text = (id: string | null | undefined, field: keyof X): string | null => (pick(id)?.[field] as string | null | undefined) ?? null;
  return Object.assign(text, {
    localeOf: (id: string | null | undefined): Locale | null => {
      const hit = pick(id)?.locale;
      return isLocale(hit) ? hit : null;
    },
  });
};

/** Language the content of a response came in: the first record not in the requested locale wins (else the requested one). */
export const contentLocaleOf = (requested: Locale, found: readonly (Locale | null)[]): Locale => found.find((l) => l && l !== requested) ?? requested;
