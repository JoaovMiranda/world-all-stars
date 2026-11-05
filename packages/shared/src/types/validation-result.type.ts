import type { TextValidationError } from '../enums/text-validation-error.enum';

/** Result of the shared free-text validation. `message` is the pt-BR text shown to the user. */
export type TextValidationResult =
  | { ok: true; text: string; length: number }
  | { ok: false; error: TextValidationError; message: string; length: number };

/** Field errors keyed by field path (`urls.0`, `athleteName`…), as returned by a 422. */
export type FieldErrors = Record<string, string>;
