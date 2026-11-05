/** Roles of an account (doc 20: no editor role). */
export const UserRole = {
  Reader: 'reader',
  Admin: 'admin',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];
export const USER_ROLE_VALUES = Object.values(UserRole) as [UserRole, ...UserRole[]];
