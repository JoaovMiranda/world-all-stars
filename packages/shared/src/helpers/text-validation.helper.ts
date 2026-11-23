import { COMMENT_MAX_LENGTH } from '../consts/text-limits.const';
import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import { TextValidationError } from '../enums/text-validation-error.enum';
import { DEFAULT_LOCALE } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';
import type { FreeTextOptions } from '../interfaces/free-text-options.interface';
import type { BannedWordRule } from '../types/banned-word.type';
import type { Locale } from '../types/locale.type';
import type { TextValidationResult } from '../types/validation-result.type';
import { hasBannedWord } from './banned-words.helper';
import { cleanText, codePointLength } from './text-normalize.helper';

/** Shared rule for any free text (comment, justification, message): empty → too long → banned word. */
export const validateFreeText = (raw: unknown, { maxLength, bannedWords, emptyMessage, locale = DEFAULT_LOCALE }: FreeTextOptions): TextValidationResult => {
  const m = textFor(VALIDATION_MESSAGES, locale);
  const text = cleanText(raw);
  const length = codePointLength(text);
  if (!text) return { ok: false, error: TextValidationError.Empty, message: emptyMessage ?? m.commentEmpty, length };
  if (length > maxLength) return { ok: false, error: TextValidationError.TooLong, message: m.tooLong(maxLength, length), length };
  if (hasBannedWord(text, bannedWords)) return { ok: false, error: TextValidationError.BannedWord, message: m.bannedWord, length };
  return { ok: true, text, length };
};

/** Comment body (doc 20): ≤ 500 code points after cleaning, not empty, no banned words. */
export const validateComment = (body: unknown, bannedWords: readonly BannedWordRule[], locale: Locale = DEFAULT_LOCALE): TextValidationResult =>
  validateFreeText(body, { maxLength: COMMENT_MAX_LENGTH, bannedWords, locale });
