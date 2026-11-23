import type { LOCALE_VALUES } from '../i18n/locale.const';

/** A language of the interface (pt-BR · en · es). */
export type Locale = (typeof LOCALE_VALUES)[number];
