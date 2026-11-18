import type { SessionResponse } from '@was/shared';

/**
 * Identity before GET /api/session answers (and of every visitor without an account). The `identity:` prefix keeps it
 * apart from the other key items (the simulated kind is also 'anon'), so the old identity's queries can be found.
 */
export const ANON_IDENTITY = 'identity:anon';

/**
 * Identity part of the query keys: session kind + account e-mail (unique; already in the
 * session answer). Changes on sign-in, sign-out, consent (pending →
 * reader) and when the dev switcher picks another demo account, so personalized answers are cached per account.
 */
export const sessionIdentity = (session: SessionResponse | undefined): string =>
  session?.user ? `identity:${session.kind}:${session.user.email}` : ANON_IDENTITY;
