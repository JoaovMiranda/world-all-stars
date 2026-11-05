/** Simulated/real session profile (docs 17/20): visitor, reader with account, admin. */
export const SessionKind = {
  Anon: 'anon',
  Reader: 'reader',
  Admin: 'admin',
} as const;
export type SessionKind = (typeof SessionKind)[keyof typeof SessionKind];
export const SESSION_KIND_VALUES = Object.values(SessionKind) as [SessionKind, ...SessionKind[]];
