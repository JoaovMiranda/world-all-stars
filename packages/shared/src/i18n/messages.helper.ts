import type { Locale } from '../types/locale.type';
import type { LocalizedMessages, Messages } from '../types/messages.type';
import { DEFAULT_LOCALE } from './locale.const';

/**
 * One dictionary in the three languages. The pt-BR object stays in `x.const.ts` (source of truth); translations live
 * next to it (`x.const.en.ts`, `x.const.es.ts`, typed `satisfies Messages<typeof X_TEXT>`).
 */
export const defineMessages = <T>(pt: T, translations: { en: Messages<T>; es: Messages<T> }): LocalizedMessages<T> => ({
  'pt-BR': pt as Messages<T>,
  en: translations.en,
  es: translations.es,
  __messages: true,
});

/** The dictionary of one locale (pt-BR if a locale were ever missing). */
export const textFor = <T>(messages: LocalizedMessages<T>, locale: Locale): Messages<T> => messages[locale] ?? messages[DEFAULT_LOCALE];
