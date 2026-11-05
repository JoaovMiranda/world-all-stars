/** Status of a privacy (LGPD) request (doc 13). */
export const PrivacyRequestStatus = {
  Open: 'open',
  InProgress: 'in_progress',
  Answered: 'answered',
  Rejected: 'rejected',
} as const;
export type PrivacyRequestStatus = (typeof PrivacyRequestStatus)[keyof typeof PrivacyRequestStatus];
export const PRIVACY_REQUEST_STATUS_VALUES = Object.values(PrivacyRequestStatus) as [PrivacyRequestStatus, ...PrivacyRequestStatus[]];
