/** Data-subject right requested (LGPD art. 18, doc 13). */
export const PrivacyRight = {
  Access: 'access',
  Correction: 'correction',
  Deletion: 'deletion',
  Portability: 'portability',
  Opposition: 'opposition',
  Revoke: 'revoke',
} as const;
export type PrivacyRight = (typeof PrivacyRight)[keyof typeof PrivacyRight];
export const PRIVACY_RIGHT_VALUES = Object.values(PrivacyRight) as [PrivacyRight, ...PrivacyRight[]];
