import { API_ERROR_MESSAGES, ApiErrorCode, type ContactRequest, type ContactTopic, type SubmissionResponse, type SuggestionRequest, SuggestionStatus, ContactStatus, validateContact, validateSuggestion } from '@was/shared';
import { currentText } from '@/i18n/text-for.helper';
import { localeStore } from '@/i18n/locale.store';

import { ApiError } from '../api-error.error';
import { demoId, demoProtocol, demoStore } from '../demo.store';
import type { loadSample } from '../sample-fixtures.helper';

const refuse = (errors: Record<string, string>) => {
  throw new ApiError(422, { error: ApiErrorCode.Validation, message: currentText(API_ERROR_MESSAGES).checkFields, errors });
};

/** POST /api/suggestions in fixture mode: shared validation, then stored for the admin inbox (A8). */
export const submitDemoSuggestion = async (sample: typeof loadSample, body: SuggestionRequest): Promise<SubmissionResponse> => {
  const ctx = await sample('validation-context.json');
  const result = validateSuggestion(body, ctx, localeStore.get());
  if (!result.ok) refuse(result.errors);
  const protocol = demoProtocol('SUG');
  demoStore.update((d) => {
    d.suggestions.push({
      id: demoId(),
      protocol,
      athleteName: result.name,
      sport: body.sport === 'outro' ? (body.sportOther ?? null) : (body.sport ?? null),
      urls: result.urls,
      why: body.why?.trim() || null,
      email: body.email?.trim() || null,
      status: SuggestionStatus.Pending,
      createdAt: new Date().toISOString(),
    });
  });
  return { protocol, notes: result.notes };
};

/** POST /api/contact in fixture mode. */
export const submitDemoContact = async (sample: typeof loadSample, body: ContactRequest): Promise<SubmissionResponse> => {
  const { bannedWords } = await sample('validation-context.json');
  const result = validateContact(body, bannedWords, localeStore.get());
  if (!result.ok) refuse(result.errors);
  const protocol = demoProtocol('CTT');
  demoStore.update((d) => {
    d.messages.push({
      id: demoId(),
      protocol,
      name: body.name.trim(),
      email: body.email.trim(),
      topic: body.topic as ContactTopic,
      body: body.body.trim(),
      status: ContactStatus.New,
      createdAt: new Date().toISOString(),
    });
  });
  return { protocol, notes: [] };
};
