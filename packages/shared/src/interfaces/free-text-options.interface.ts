import type { BannedWordRule } from '../types/banned-word.type';
import type { Locale } from '../types/locale.type';

/** Options of `validateFreeText`. */
export interface FreeTextOptions {
  maxLength: number;
  bannedWords: readonly BannedWordRule[];
  emptyMessage?: string;
  /** Language of the messages (the request locale on the server, the page locale in the form). */
  locale?: Locale;
}
