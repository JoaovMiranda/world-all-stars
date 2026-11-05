/** Who files a privacy request (doc 13). */
export const PrivacySubjectKind = {
  User: 'user',
  Athlete: 'athlete',
  Heir: 'heir',
  Other: 'other',
} as const;
export type PrivacySubjectKind = (typeof PrivacySubjectKind)[keyof typeof PrivacySubjectKind];
export const PRIVACY_SUBJECT_KIND_VALUES = Object.values(PrivacySubjectKind) as [PrivacySubjectKind, ...PrivacySubjectKind[]];
