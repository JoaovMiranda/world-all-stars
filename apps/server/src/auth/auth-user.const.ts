import { SessionKind } from '@was/shared';

import type { SessionContext } from './auth-provider.type';

export const ANON_SESSION: SessionContext = { kind: SessionKind.Anon, user: null, pending: null, source: null };
