import { athleteSuggestions, contactMessages } from '@was/db';
import {
  type ContactRequest,
  type ContactTopic,
  cleanText,
  type SubmissionResponse,
  type SuggestionRequest,
  submissionProtocol,
  validateContact,
  validateSuggestion,
} from '@was/shared';

import type { RequestContext } from '../../core/request-context.interface';
import { invalidFields } from '../../http/http-error.helper';
import { loadBannedWords } from '../moderation/moderation.repository';
import { getSuggestionContext } from '../moderation/validation-context.service';

/** POST /api/suggestions (doc 21): shared validateSuggestion (https, anti-SSRF, rejected sources, duplicates) → 422. */
export const submitSuggestion = async (ctx: RequestContext, body: SuggestionRequest): Promise<SubmissionResponse> => {
  const [context, view] = await Promise.all([getSuggestionContext(ctx.deps), ctx.deps.catalog.get(ctx.locale)]);
  const result = validateSuggestion(body, context, ctx.locale);
  if (!result.ok) throw invalidFields(result.errors);
  const sport = body.sport && body.sport !== 'outro' ? view.sportBySlug(body.sport) : null;
  const protocol = submissionProtocol('SUG');
  await ctx.deps.repo.insert(
    athleteSuggestions,
    {
      athleteName: result.name,
      sportId: sport?.id ?? null,
      sportOther: body.sport === 'outro' ? cleanText(body.sportOther) || null : sport ? null : cleanText(body.sport) || null,
      urls: result.urls,
      justification: cleanText(body.why) || null,
      contactEmail: cleanText(body.email) || ctx.session.user?.email || null,
      userId: ctx.session.user?.id ?? null,
      protocol,
      ipHash: ctx.ipHash,
    },
    ctx.actor,
  );
  return { protocol, notes: result.notes };
};

/** POST /api/contact (doc 21): shared validateContact → 422. */
export const submitContact = async (ctx: RequestContext, body: ContactRequest): Promise<SubmissionResponse> => {
  const result = validateContact(body, await loadBannedWords(ctx.deps.db), ctx.locale);
  if (!result.ok) throw invalidFields(result.errors);
  const protocol = submissionProtocol('CTT');
  await ctx.deps.repo.insert(
    contactMessages,
    {
      name: cleanText(body.name),
      email: body.email.trim(),
      topic: body.topic as ContactTopic,
      body: cleanText(body.body),
      userId: ctx.session.user?.id ?? null,
      protocol,
      ipHash: ctx.ipHash,
    },
    ctx.actor,
  );
  return { protocol, notes: [] };
};
