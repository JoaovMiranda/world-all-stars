import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import type { Locale } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';

/** Public pseudonym of an anonymized (deleted) account: comments and votes stay under it (doc 13). */
export const anonymizedUserName = (seed: number): string => `Usuário removido #${String(Math.abs(Math.trunc(seed)) % 10000).padStart(4, '0')}`;

/** Word that confirms the account deletion in a language (doc 13): EXCLUIR · DELETE · ELIMINAR. */
export const accountDeleteWord = (locale: Locale): string => textFor(VALIDATION_MESSAGES, locale).accountDeleteWord;

/** null when `typed` is the word of `locale` (only that language's word counts), else the translated hint. */
export const accountDeleteConfirmationError = (typed: string, locale: Locale): string | null => {
  const m = textFor(VALIDATION_MESSAGES, locale);
  return typed.trim() === m.accountDeleteWord ? null : m.accountDeleteConfirmation(m.accountDeleteWord);
};
