import type { Locale } from '@was/shared';

import { localeStore, useLocale } from './locale.store';

/**
 * Value of the current language from a plain per-locale map. For content whose shape can't be a `Messages<T>`
 * (long documents with discriminated blocks: legal pages, "how we choose"); every locale is typed with the same type.
 */
export const useLocalized = <T>(byLocale: Readonly<Record<Locale, T>>): T => byLocale[useLocale()];

/** Same, outside React (route loaders/head). */
export const currentLocalized = <T>(byLocale: Readonly<Record<Locale, T>>): T => byLocale[localeStore.get()];
