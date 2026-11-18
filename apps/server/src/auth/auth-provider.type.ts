import type { SessionKind, UserRole } from '@was/shared';

/** The signed-in account as the API needs it (counters for the session payload, ban for the access rule). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;
  /** Identity provider verified the e-mail (Google always does). Reader routes answer 403 email_unverified otherwise. */
  emailVerified: boolean;
  bannedAt: Date | null;
  tierVotesCount: number;
  commentsCount: number;
}

/** Which provider resolved the session (null = nobody signed in). */
export type SessionSource = 'better-auth' | 'simulated';

export interface SessionContext {
  kind: SessionKind;
  user: AuthUser | null;
  /**
   * Signed in, but the current Terms/Privacy are not accepted yet (doc 13): the session counts as ANONYMOUS
   * (kind anon, user null) until POST /api/account/consent; this is the account waiting for it.
   */
  pending: AuthUser | null;
  source: SessionSource | null;
}

/** Minimal request view an auth provider reads (headers + cookies), so it does not depend on Hono. */
export interface AuthRequest {
  /** Every request header (Better Auth reads its cookie from them). */
  headers: Headers;
  header(name: string): string | undefined;
  cookie(name: string): string | undefined;
  query(name: string): string | undefined;
}

/**
 * Who is calling: Better Auth (Google) first, then — dev only, AUTH_SIMULATED — the simulated switcher
 * (auth/composite.provider.ts). Routes, access rules and the actor only see this interface.
 */
export interface AuthProvider {
  readonly name: string;
  resolve(request: AuthRequest): Promise<SessionContext>;
}
