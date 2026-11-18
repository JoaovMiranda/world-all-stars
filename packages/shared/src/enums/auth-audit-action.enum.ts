/** audit_logs actions of the sign-in lifecycle (Better Auth hooks + consent, doc 05). Not listed in the admin audit. */
export const AuthAuditAction = {
  SignedUp: 'auth_signed_up',
  SignedIn: 'auth_signed_in',
  ConsentAccepted: 'auth_consent_accepted',
} as const;
export type AuthAuditAction = (typeof AuthAuditAction)[keyof typeof AuthAuditAction];
