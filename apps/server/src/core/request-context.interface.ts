import type { Actor } from '@was/db';
import type { Locale } from '@was/shared';

import type { SessionContext } from '../auth/auth-provider.type';
import type { AppDeps } from '../http/app-deps.interface';

/** Per-request context given to every contract handler, controller and service. */
export interface RequestContext {
  deps: AppDeps;
  session: SessionContext;
  /** Writer identity for the BaseRepository (user id + name, ip hash, user agent). */
  actor: Actor;
  ipHash: string;
  /** Language of the request (localeMiddleware): messages, labels and catalog content. */
  locale: Locale;
}
