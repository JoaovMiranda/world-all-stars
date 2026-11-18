import type { Messages } from '../i18n/messages.helper';
import type { VALIDATION_TEXT } from './validation-messages.const';

export const VALIDATION_TEXT_EN = {
  required: 'Required field.',
  commentEmpty: 'Write something before posting. Spaces or blank lines alone don’t count.',
  tooLong: (max, length) => `The limit is ${max} characters (your text has ${length}).`,
  bannedWord: 'The text contains a word that isn’t allowed here. Rephrase it and try again.',
  athleteNameRequired: 'Enter the athlete’s name.',
  athleteNameTooLong: (max) => `Name too long (${max} characters max).`,
  athleteExists: (knownAs) => `${knownAs} is already on the site.`,
  urlsRequired: 'Add at least one source link (for example, the athlete’s Wikipedia page).',
  urlsTooMany: (max) => `Use at most ${max} links.`,
  urlsDuplicated: 'Some links are repeated.',
  urlInvalid: 'That doesn’t look like a link. Paste the full address, starting with https://',
  urlNotHttps: 'Use a secure link, starting with https://',
  urlForbiddenHost: 'Address not accepted. Use the public link of the page.',
  urlRejectedSource: (source) => `${source} is not accepted as a source (undisclosed data origin).`,
  noteLinkOnly: (source) => `${source} is kept as a reference only: its content is not collected.`,
  noteNoWiki: 'Without a Wikipedia or Wikidata link, curators check the source by hand (it may take longer).',
  emailInvalid: 'Invalid email address.',
  contactNameRequired: 'Enter your name.',
  contactEmailRequired: 'Enter a valid email address so we can reply.',
  contactTopicRequired: 'Choose a topic.',
  contactBodyEmpty: 'Write your message. Spaces alone don’t count.',
  accountDeleteConfirmation: (word) => `Type ${word} to confirm.`,
} satisfies Messages<typeof VALIDATION_TEXT>;
