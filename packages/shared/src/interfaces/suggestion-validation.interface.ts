import type { BannedWordRule } from '../types/banned-word.type';
import type { KnownAthlete } from '../types/known-athlete.type';
import type { SourceDomainRule } from '../types/source-rule.type';
import type { FieldErrors } from '../types/validation-result.type';

/** Raw form values of the "Suggest an athlete" form (strings as typed; urls may contain blanks). */
export interface SuggestionDraft {
  athleteName: string;
  sport?: string | null | undefined;
  sportOther?: string | null | undefined;
  urls: readonly string[];
  why?: string | null | undefined;
  email?: string | null | undefined;
}

export interface SuggestionContext {
  bannedWords: readonly BannedWordRule[];
  sources: readonly SourceDomainRule[];
  knownAthletes: readonly KnownAthlete[];
}

export interface SuggestionValidation {
  ok: boolean;
  /** Field path → message. Paths: athleteName, urls, urls.N, why, email. */
  errors: FieldErrors;
  /** Non-blocking notes (link-only source, no Wikipedia link). */
  notes: string[];
  name: string;
  urls: string[];
  existing: { slug: string; knownAs: string } | null;
}
