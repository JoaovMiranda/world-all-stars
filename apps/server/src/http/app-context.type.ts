import type { Locale } from '@was/shared';

import type { AuthUser } from '../auth/auth-provider.type';
import type { RequestContext } from '../core/request-context.interface';
import type { SsrSessionMemo } from './ssr-session-memo.interface';

/** Same as RequestContext, with the signed-in user guaranteed (contracts with access reader/admin). */
export type SignedInContext = RequestContext & { user: AuthUser };

export type HonoEnv = {
  Bindings: { ssrSession?: SsrSessionMemo };
  Variables: {
    request: RequestContext;
    requestId: string;
    /** Pages only: CSP nonce of this response. */
    cspNonce: string;
    /** Request language (API: localeMiddleware; pages: web.route). */
    locale: Locale;
  };
};
