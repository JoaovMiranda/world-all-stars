/** The part of a Better Auth database-hook context read by our hooks. */
export interface HookContext {
  headers?: Headers | undefined;
  request?: Request | undefined;
}
