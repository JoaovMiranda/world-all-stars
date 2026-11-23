import type { ApiAccess, ApiContract } from '@was/shared';
import type { z } from 'zod';

import type { AuthUser } from '../auth/auth-provider.type';
import type { RequestContext } from '../core/request-context.interface';
import type { ContractInputOf } from './contract-input-of.interface';

type UserOf<C extends ApiContract> = C['access'] extends typeof ApiAccess.Public ? AuthUser | null : AuthUser;

export type ContractHandler<C extends ApiContract> = (
  input: ContractInputOf<C>,
  ctx: RequestContext & { user: UserOf<C> },
) => Promise<z.input<C['response']>> | z.input<C['response']>;
