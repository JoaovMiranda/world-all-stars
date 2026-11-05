import { CONTACT_MESSAGE_MAX_LENGTH, CONTACT_NAME_MAX_LENGTH } from '../consts/text-limits.const';
import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import { CONTACT_TOPIC_VALUES, type ContactTopic } from '../enums/contact-topic.enum';
import type { BannedWordRule } from '../types/banned-word.type';
import type { FieldErrors } from '../types/validation-result.type';
import { isEmail } from './email.helper';
import { validateFreeText } from './text-validation.helper';
import { cleanText, codePointLength } from './text-normalize.helper';

export interface ContactDraft {
  name: string;
  email: string;
  topic: string;
  body: string;
}

/** Validates the "Mensagem" tab (doc 21): name, e-mail, topic and body (≤ 1000, not empty, no banned words). */
export const validateContact = (draft: ContactDraft, bannedWords: readonly BannedWordRule[]): { ok: boolean; errors: FieldErrors } => {
  const errors: FieldErrors = {};
  const name = cleanText(draft.name);
  if (!name) errors.name = VALIDATION_MESSAGES.contactNameRequired;
  else if (codePointLength(name) > CONTACT_NAME_MAX_LENGTH) errors.name = VALIDATION_MESSAGES.tooLong(CONTACT_NAME_MAX_LENGTH, codePointLength(name));
  if (!isEmail(draft.email)) errors.email = VALIDATION_MESSAGES.contactEmailRequired;
  if (!CONTACT_TOPIC_VALUES.includes(draft.topic as ContactTopic)) errors.topic = VALIDATION_MESSAGES.contactTopicRequired;
  const body = validateFreeText(draft.body, {
    maxLength: CONTACT_MESSAGE_MAX_LENGTH,
    bannedWords,
    emptyMessage: VALIDATION_MESSAGES.contactBodyEmpty,
  });
  if (!body.ok) errors.body = body.message;
  return { ok: Object.keys(errors).length === 0, errors };
};
