import type { Messages } from '../i18n/messages.helper';
import type { API_ERROR_TEXT } from './api-error-messages.const';

export const API_ERROR_TEXT_EN = {
  checkFields: 'Check the highlighted fields.',
  signIn: 'Sign in to continue.',
  forbidden: 'You don’t have permission to do this.',
  banned: 'Your account is suspended.',
  notFound: 'Not found.',
  ownComment: 'You can’t react to your own comment.',
  parentGone: 'The comment you replied to no longer exists.',
  mythicNeedsDossier: 'Mythic requires an approved “Game changer” dossier.',
  sameTier: 'The athlete is already in that tier.',
  proposalDecided: 'This proposal has already been decided.',
  dossierDecided: 'This dossier has already been decided.',
  dossierAlreadyApproved: 'You already approved this dossier: it still needs another admin’s approval.',
  ownAccount: 'You can’t change your own account.',
  bannedWordExists: 'This word is already on the list.',
  bannedWordExistsField: 'This word is already on the list for this language.',
  invalidLinks: 'Some links are invalid.',
  rateLimited: 'Too many attempts. Wait a moment and try again.',
  internal: 'Something went wrong on our side. Please try again.',
  invalidJson: 'Invalid JSON.',
  payloadTooLarge: 'The content sent is too large.',
  emailUnverified: 'Your e-mail has not been verified by the sign-in provider yet. Verify it and sign in again.',
  consentOutdated: 'The Terms or the Privacy notice changed. Reload the page and accept the current versions.',
  consentNotPending: 'There is no pending acceptance for this session.',
} satisfies Messages<typeof API_ERROR_TEXT>;
