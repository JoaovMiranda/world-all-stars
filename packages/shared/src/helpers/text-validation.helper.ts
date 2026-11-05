import { COMMENT_MAX_LENGTH } from '../consts/text-limits.const';
import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import { TextValidationError } from '../enums/text-validation-error.enum';
import type { BannedWordRule } from '../types/banned-word.type';
import type { TextValidationResult } from '../types/validation-result.type';
import { hasBannedWord } from './banned-words.helper';
import { cleanText, codePointLength } from './text-normalize.helper';

interface FreeTextOptions {
  maxLength: number;
  bannedWords: readonly BannedWordRule[];
  emptyMessage?: string;
}

/** Shared rule for any free text (comment, justification, message): empty → too long → banned word. */
export const validateFreeText = (raw: unknown, { maxLength, bannedWords, emptyMessage }: FreeTextOptions): TextValidationResult => {
  const text = cleanText(raw);
  const length = codePointLength(text);
  if (!text) return { ok: false, error: TextValidationError.Empty, message: emptyMessage ?? VALIDATION_MESSAGES.commentEmpty, length };
  if (length > maxLength) return { ok: false, error: TextValidationError.TooLong, message: VALIDATION_MESSAGES.tooLong(maxLength, length), length };
  if (hasBannedWord(text, bannedWords)) return { ok: false, error: TextValidationError.BannedWord, message: VALIDATION_MESSAGES.bannedWord, length };
  return { ok: true, text, length };
};

/** Comment body (doc 20): ≤ 500 code points after cleaning, not empty, no banned words. */
export const validateComment = (body: unknown, bannedWords: readonly BannedWordRule[]): TextValidationResult =>
  validateFreeText(body, { maxLength: COMMENT_MAX_LENGTH, bannedWords });
