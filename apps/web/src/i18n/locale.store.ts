import { LOCALE_COOKIE, type Locale } from '@was/shared';
import { useSyncExternalStore } from 'react';

import { getBoot } from '@/app/request-scope';
import { writeCookie } from '@/shared-ui/cookie.helper';

const listeners = new Set<() => void>();

/**
 * Interface language (doc 12: same URL, choice in the `was_locale` cookie). Server: the boot of the request. Browser:
 * the boot of the page load, switched in place by `set` (cookie for the next loads, <html lang>, re-render). The
 * caller (LanguageSwitcher) then runs `router.invalidate()` so loaders/head() and localized API data follow.
 */
export const localeStore = {
  get: (): Locale => getBoot().locale,
  set(locale: Locale): void {
    const boot = getBoot();
    if (locale === boot.locale) return;
    boot.locale = locale;
    writeCookie(LOCALE_COOKIE, locale);
    document.documentElement.lang = locale;
    listeners.forEach((l) => l());
  },
  subscribe(listener: () => void): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};

/** Current interface language (re-renders on switch). */
export const useLocale = (): Locale => useSyncExternalStore(localeStore.subscribe, localeStore.get, localeStore.get);
