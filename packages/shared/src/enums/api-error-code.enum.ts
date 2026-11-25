/** `error` code of the API error body (ApiErrorSchema). Same codes from the server and the web fixtures. */
export const ApiErrorCode = {
  Validation: 'validation',
  Auth: 'auth',
  Forbidden: 'forbidden',
  Banned: 'banned',
  NotFound: 'not_found',
  Own: 'own',
  Parent: 'parent',
  DossierRequired: 'dossier_required',
  SameTier: 'same_tier',
  AlreadyDecided: 'already_decided',
  RateLimited: 'rate_limited',
  /** The account is younger than the minimum age to vote (tier-vote anti-fraud, T3.2). */
  AccountTooNew: 'account_too_new',
  /** The comment can no longer be edited (10-minute window, T3.3). */
  EditWindowClosed: 'edit_window_closed',
  /** Signed in with an e-mail the identity provider did not verify (doc 05). */
  EmailUnverified: 'email_unverified',
  /** The accepted legal versions are not the current ones (POST /api/account/consent). */
  ConsentOutdated: 'consent_outdated',
  /** Request body above the API limit (BODY_LIMIT_KB). */
  PayloadTooLarge: 'payload_too_large',
  Internal: 'internal',
} as const;
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
export const API_ERROR_CODE_VALUES = Object.values(ApiErrorCode) as [ApiErrorCode, ...ApiErrorCode[]];
