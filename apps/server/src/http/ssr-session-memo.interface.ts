import type { SessionContext } from '../auth/auth-provider.type';

/**
 * One page render: the API calls the renderer makes in-process (`app.fetch(request, { ssrSession })`) carry the same
 * cookies, so the session is resolved once per page instead of once per call.
 */
export interface SsrSessionMemo {
  session?: Promise<SessionContext>;
}
