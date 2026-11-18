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
  /** Signed in with an e-mail the identity provider did not verify (doc 05). */
  EmailUnverified: 'email_unverified',
  /** The accepted legal versions are not the current ones (POST /api/account/consent). */
  ConsentOutdated: 'consent_outdated',
  Internal: 'internal',
} as const;
export type ApiErrorCode = (typeof ApiErrorCode)[keyof typeof ApiErrorCode];
export const API_ERROR_CODE_VALUES = Object.values(ApiErrorCode) as [ApiErrorCode, ...ApiErrorCode[]];
