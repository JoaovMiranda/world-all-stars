import type { DatabaseHandle } from '@was/db';
import type { ApiContract, SessionKind } from '@was/shared';

import type { createApp } from '../app';

export interface TestApp {
  handle: DatabaseHandle;
  app: ReturnType<typeof createApp>['app'];
  /** The app's dependencies (db, repository with its cache hooks…) for service-level tests. */
  deps: ReturnType<typeof createApp>['deps'];
  /** Calls an endpoint BY ITS CONTRACT (same path builder as the web http client). */
  call(
    contract: ApiContract,
    input?: { params?: Record<string, unknown>; query?: Record<string, unknown>; body?: unknown },
    as?: SessionKind,
  ): Promise<{ status: number; json: any }>;
  close(): Promise<void>;
}
