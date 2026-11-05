/** Error codes of the shared free-text validation (comments, justifications, messages). */
export const TextValidationError = {
  Empty: 'empty',
  TooLong: 'too_long',
  BannedWord: 'banned_word',
} as const;
export type TextValidationError = (typeof TextValidationError)[keyof typeof TextValidationError];
export const TEXT_VALIDATION_ERROR_VALUES = Object.values(TextValidationError) as [TextValidationError, ...TextValidationError[]];
