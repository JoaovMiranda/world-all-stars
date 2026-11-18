import { WIKI_SOURCE_HOST_REGEX } from '../consts/source-url.const';
import {
  SUGGESTION_NAME_MAX_LENGTH,
  SUGGESTION_URLS_MAX,
  SUGGESTION_WHY_MAX_LENGTH,
} from '../consts/text-limits.const';
import { DEFAULT_LOCALE, type Locale } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';
import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import { TextValidationError } from '../enums/text-validation-error.enum';
import type { BannedWordRule } from '../types/banned-word.type';
import type { SourceDomainRule } from '../types/source-rule.type';
import type { FieldErrors } from '../types/validation-result.type';
import { isEmail } from './email.helper';
import { checkSourceUrl } from './source-url.helper';
import { validateFreeText } from './text-validation.helper';
import { cleanText, codePointLength, normalizeForSearch } from './text-normalize.helper';

/** Raw form values of "Sugerir atleta" (strings as typed; urls may contain blanks). */
export interface SuggestionDraft {
  athleteName: string;
  sport?: string | null | undefined;
  sportOther?: string | null | undefined;
  urls: readonly string[];
  why?: string | null | undefined;
  email?: string | null | undefined;
}

/** Athletes already on the site, to refuse duplicates (known name or full name, no accents/case). */
export type KnownAthlete = { slug: string; knownAs: string; fullName: string | null };

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

/** Validates an athlete suggestion (doc 21). Same function on the server (422 body) and in the form. */
export const validateSuggestion = (draft: SuggestionDraft, ctx: SuggestionContext, locale: Locale = DEFAULT_LOCALE): SuggestionValidation => {
  const m = textFor(VALIDATION_MESSAGES, locale);
  const errors: FieldErrors = {};
  const notes: string[] = [];
  const name = cleanText(draft.athleteName);
  if (!name) errors.athleteName = m.athleteNameRequired;
  else if (codePointLength(name) > SUGGESTION_NAME_MAX_LENGTH) errors.athleteName = m.athleteNameTooLong(SUGGESTION_NAME_MAX_LENGTH);

  const urls: string[] = [];
  const typed = draft.urls.map((u, index) => ({ raw: cleanText(u), index })).filter((u) => u.raw);
  if (typed.length === 0) errors.urls = m.urlsRequired;
  else if (typed.length > SUGGESTION_URLS_MAX) errors.urls = m.urlsTooMany(SUGGESTION_URLS_MAX);
  for (const { raw, index } of typed) {
    const check = checkSourceUrl(raw, ctx.sources, locale);
    if (!check.ok) errors[`urls.${index}`] = check.message;
    else {
      urls.push(check.url);
      if (check.note) notes.push(check.note);
    }
  }
  if (new Set(urls).size !== urls.length) errors.urls = m.urlsDuplicated;
  if (urls.length > 0 && !errors.urls && !urls.some((u) => WIKI_SOURCE_HOST_REGEX.test(new URL(u).hostname))) {
    notes.push(m.noteNoWiki);
  }

  if (cleanText(draft.why)) {
    const why = validateFreeText(draft.why, { maxLength: SUGGESTION_WHY_MAX_LENGTH, bannedWords: ctx.bannedWords, locale });
    if (!why.ok && why.error !== TextValidationError.Empty) errors.why = why.message;
  }
  if (cleanText(draft.email) && !isEmail(draft.email)) errors.email = m.emailInvalid;

  const key = normalizeForSearch(name);
  const found = key ? ctx.knownAthletes.find((a) => [a.knownAs, a.fullName].some((n) => n && normalizeForSearch(n) === key)) : undefined;
  const existing = found ? { slug: found.slug, knownAs: found.knownAs } : null;
  if (existing && !errors.athleteName) errors.athleteName = m.athleteExists(existing.knownAs);

  return { ok: Object.keys(errors).length === 0, errors, notes, name, urls, existing };
};
