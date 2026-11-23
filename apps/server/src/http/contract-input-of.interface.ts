import type { ApiContract } from '@was/shared';
import type { z } from 'zod';

type Parsed<S> = S extends z.ZodType ? z.output<S> : undefined;

/** Validated input of a contract: params/query/body parsed by the contract's own schemas. */
export interface ContractInputOf<C extends ApiContract> {
  params: Parsed<C['params']>;
  query: Parsed<C['query']>;
  body: Parsed<C['body']>;
}
