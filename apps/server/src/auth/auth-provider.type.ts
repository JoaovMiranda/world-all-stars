import type { SessionKind, UserRole } from '@was/shared';

/** The signed-in account as the API needs it (counters for the session payload, ban for the access rule). */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  bannedAt: Date | null;
  tierVotesCount: number;
  commentsCount: number;
}

export interface SessionContext {
  kind: SessionKind;
  user: AuthUser | null;
}

/** Minimal request view an auth provider reads (headers + cookies), so it does not depend on Hono. */
export interface AuthRequest {
  header(name: string): string | undefined;
  cookie(name: string): string | undefined;
  query(name: string): string | undefined;
}

/**
 * Who is calling. Today: the SIMULATED provider (x-was-session header / was_session cookie / ?as= → demo accounts).
 * Tomorrow: a Better Auth provider (`auth.api.getSession({ headers })` → user row) implementing the same interface;
 * nothing else in the server changes (see BACKEND.md).
 */
export interface AuthProvider {
  readonly name: string;
  resolve(request: AuthRequest): Promise<SessionContext>;
}
