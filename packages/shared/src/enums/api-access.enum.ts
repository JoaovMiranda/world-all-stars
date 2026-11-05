/** Who may call an endpoint. */
export const ApiAccess = {
  Public: 'public',
  Reader: 'reader',
  Admin: 'admin',
} as const;
export type ApiAccess = (typeof ApiAccess)[keyof typeof ApiAccess];
export const API_ACCESS_VALUES = Object.values(ApiAccess) as [ApiAccess, ...ApiAccess[]];
