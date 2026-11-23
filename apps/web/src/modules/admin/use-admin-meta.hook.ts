import type { Locale } from '@was/shared';

import { localeStore, useLocale } from '@/i18n/locale.store';
import { buildAdminMeta } from './admin-meta.helper';
import type { AdminMeta } from './admin-meta.type';

const cache = new Map<Locale, AdminMeta>();
const metaFor = (locale: Locale): AdminMeta => {
  let hit = cache.get(locale);
  if (!hit) cache.set(locale, (hit = buildAdminMeta(locale)));
  return hit;
};

/** Admin status labels (+ tag tones) and value labels in the current language. */
export const useAdminMeta = (): AdminMeta => metaFor(useLocale());
/** Same, outside React (helpers): reads the locale at call time. */
export const currentAdminMeta = (): AdminMeta => metaFor(localeStore.get());
