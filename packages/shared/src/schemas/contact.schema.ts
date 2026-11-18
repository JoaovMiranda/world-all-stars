import { DEFAULT_LOCALE, type Locale } from '../i18n/locale.const';
import { z } from 'zod';

import { validateContact } from '../helpers/contact-validation.helper';
import { validateSuggestion, type SuggestionContext } from '../helpers/suggestion-validation.helper';
import type { BannedWordRule } from '../types/banned-word.type';

/** Body of POST /api/contact (+ Turnstile token in the future). */
export const ContactRequestSchema = z.object({
  name: z.string(),
  email: z.string(),
  topic: z.string(),
  body: z.string(),
});
export type ContactRequest = z.infer<typeof ContactRequestSchema>;
/** Response of POST /api/contact and /api/suggestions: protocol shown to the sender (CTT-… / SUG-…). */
export const SubmissionResponseSchema = z.object({ protocol: z.string().min(1), notes: z.array(z.string()) });
export type SubmissionResponse = z.infer<typeof SubmissionResponseSchema>;

/** Body of POST /api/suggestions (doc 21). */
export const SuggestionRequestSchema = z.object({
  athleteName: z.string(),
  sport: z.string().nullable().optional(),
  sportOther: z.string().nullable().optional(),
  urls: z.array(z.string()),
  why: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});
export type SuggestionRequest = z.infer<typeof SuggestionRequestSchema>;

const addFieldErrors = (ctx: z.RefinementCtx, errors: Record<string, string>) => {
  for (const [path, message] of Object.entries(errors)) {
    ctx.addIssue({ code: 'custom', path: path.split('.').map((p) => (/^\d+$/.test(p) ? Number(p) : p)), message });
  }
};

/** Form/server validation of the message tab (same rules on both sides). */
export const createContactInputSchema = (bannedWords: readonly BannedWordRule[], locale: Locale = DEFAULT_LOCALE) =>
  ContactRequestSchema.superRefine((value, ctx) => addFieldErrors(ctx, validateContact(value, bannedWords, locale).errors));

/** Form/server validation of the suggestion tab (https, anti-SSRF, rejected/link-only sources, duplicates). */
export const createSuggestionInputSchema = (context: SuggestionContext, locale: Locale = DEFAULT_LOCALE) =>
  SuggestionRequestSchema.superRefine((value, ctx) => addFieldErrors(ctx, validateSuggestion(value, context, locale).errors));

