import type { SessionResponse } from '@was/shared';
import { ANON_IDENTITY } from './session-identity.const';

/**
 * Identity part of the query keys: session kind + account e-mail (unique; already in the
 * session answer). Changes on sign-in, sign-out, consent (pending →
 * reader) and when the dev switcher picks another demo account, so personalized answers are cached per account.
 */
export const sessionIdentity = (session: SessionResponse | undefined): string =>
  session?.user ? `identity:${session.kind}:${session.user.email}` : ANON_IDENTITY;
