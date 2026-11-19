/** Languages of the interface (doc 12: same URL, the choice lives in a cookie). pt-BR is the interface's default; catalog data is English at the source. */
export const LOCALE_VALUES = ['pt-BR', 'en', 'es'] as const;
export type Locale = (typeof LOCALE_VALUES)[number];
export const DEFAULT_LOCALE: Locale = 'pt-BR';
/** Language of the catalog DATA at the source (handoff v3 §11): slugs and base texts; pt-BR/es are translations. */
export const CONTENT_SOURCE_LOCALE: Locale = 'en';
/** Preference cookie (1 year, Lax, strictly necessary: doc 13) read by the server render and the API. */
export const LOCALE_COOKIE = 'was_locale';
/** Header the web client sends with every API call (wins over the cookie: the page's current language). */
export const LOCALE_HEADER = 'x-was-locale';
/** Optional `?locale=` of API requests (debugging, links shared by support). Pages never use it (same URL). */
export const LOCALE_QUERY_PARAM = 'locale';
/** Each language in its own name (shown as is in the language switcher, whatever the current language). */
export const LOCALE_AUTONYMS: Record<Locale, string> = { 'pt-BR': 'Português (Brasil)', en: 'English', es: 'Español' };
/** Short code shown on the switcher button. */
export const LOCALE_SHORT: Record<Locale, string> = { 'pt-BR': 'PT', en: 'EN', es: 'ES' };
/** Open Graph `og:locale` of each language. */
export const LOCALE_OG: Record<Locale, string> = { 'pt-BR': 'pt_BR', en: 'en_US', es: 'es_ES' };

export const isLocale = (value: unknown): value is Locale => LOCALE_VALUES.includes(value as Locale);
