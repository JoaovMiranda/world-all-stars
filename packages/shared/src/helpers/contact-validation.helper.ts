import { CONTACT_MESSAGE_MAX_LENGTH, CONTACT_NAME_MAX_LENGTH } from '../consts/text-limits.const';
import { VALIDATION_MESSAGES } from '../consts/validation-messages.const';
import { CONTACT_TOPIC_VALUES, type ContactTopic } from '../enums/contact-topic.enum';
import { DEFAULT_LOCALE } from '../i18n/locale.const';
import { textFor } from '../i18n/messages.helper';
import type { ContactDraft } from '../interfaces/contact-draft.interface';
import type { BannedWordRule } from '../types/banned-word.type';
import type { Locale } from '../types/locale.type';
import type { FieldErrors } from '../types/validation-result.type';
import { isEmail } from './email.helper';
import { cleanText, codePointLength } from './text-normalize.helper';
import { validateFreeText } from './text-validation.helper';

/** Validates the Message tab (doc 21): name, e-mail, topic and body (≤ 1000, not empty, no banned words). */
export const validateContact = (
  draft: ContactDraft,
  bannedWords: readonly BannedWordRule[],
  locale: Locale = DEFAULT_LOCALE,
): { ok: boolean; errors: FieldErrors } => {
  const m = textFor(VALIDATION_MESSAGES, locale);
  const errors: FieldErrors = {};
  const name = cleanText(draft.name);
  if (!name) errors.name = m.contactNameRequired;
  else if (codePointLength(name) > CONTACT_NAME_MAX_LENGTH) errors.name = m.tooLong(CONTACT_NAME_MAX_LENGTH, codePointLength(name));
  if (!isEmail(draft.email)) errors.email = m.contactEmailRequired;
  if (!CONTACT_TOPIC_VALUES.includes(draft.topic as ContactTopic)) errors.topic = m.contactTopicRequired;
  const body = validateFreeText(draft.body, {
    maxLength: CONTACT_MESSAGE_MAX_LENGTH,
    bannedWords,
    emptyMessage: m.contactBodyEmpty,
    locale,
  });
  if (!body.ok) errors.body = body.message;
  return { ok: Object.keys(errors).length === 0, errors };
};
