import { DEFAULT_LOCALE, type Locale } from './locale.const';

/**
 * Shape a translation must have: the same keys as the pt-BR source, strings as `string` (not the pt literal), and
 * message functions with the same parameters. Arrays/tuples keep their length (one translated item per pt item).
 */
export type Messages<T> = T extends string
  ? string
  : T extends number
    ? number
    : T extends boolean
      ? boolean
      : T extends (...args: infer A) => infer R
        ? (...args: A) => Messages<R>
        : T extends object
          ? { readonly [K in keyof T]: Messages<T[K]> }
          : T;

/** A dictionary in every supported language (built by `defineMessages`, read by `textFor` / `useText`). */
export type LocalizedMessages<T> = { readonly [L in Locale]: Messages<T> } & { readonly __messages: true };

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
