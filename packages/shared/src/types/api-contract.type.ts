import type { z } from 'zod';

import type { ApiAccess } from '../enums/api-access.enum';
import type { HttpMethod } from '../enums/http-method.enum';

/**
 * One HTTP endpoint described once and consumed by both sides: the server (Hono route + zValidator) and the web
 * data layer (defineEndpoint). `path` uses `:name` placeholders that must match the `params` schema keys.
 */
export interface ApiContract {
  method: HttpMethod;
  path: `/api/${string}`;
  access: ApiAccess;
  summary: string;
  params?: z.ZodType;
  query?: z.ZodType;
  body?: z.ZodType;
  response: z.ZodType;
}

type InputOf<S> = S extends z.ZodType ? z.input<S> : never;
type Field<K extends string, S> = S extends z.ZodType ? { [P in K]: InputOf<S> } : { [P in K]?: never };

/** What a caller passes to an endpoint: `{ params?, query?, body? }` typed from the contract. */
export type ContractInput<C extends ApiContract> = Field<'params', C['params']> & Field<'query', C['query']> & Field<'body', C['body']>;
/** Parsed (validated) response type of a contract. */
export type ContractResponse<C extends ApiContract> = z.infer<C['response']>;
