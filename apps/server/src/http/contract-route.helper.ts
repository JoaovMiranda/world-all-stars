import { type ApiContract, ApiErrorCode, ApiAccess, type RateLimitKey, accessDenial } from '@was/shared';
import type { Context, Hono } from 'hono';
import type { z } from 'zod';

import type { AuthUser } from '../auth/auth-provider.type';
import type { HonoEnv, RequestContext } from './app-context.type';
import { HttpError, forbidden, httpError, invalidFields } from './http-error.error';
import { fieldErrorsOf } from './zod-errors.helper';

type Parsed<S> = S extends z.ZodType ? z.output<S> : undefined;
/** Validated input of a contract: params/query/body parsed by the contract's own schemas. */
export interface ContractInputOf<C extends ApiContract> {
  params: Parsed<C['params']>;
  query: Parsed<C['query']>;
  body: Parsed<C['body']>;
}
type UserOf<C extends ApiContract> = C['access'] extends typeof ApiAccess.Public ? AuthUser | null : AuthUser;
export type ContractHandler<C extends ApiContract> = (
  input: ContractInputOf<C>,
  ctx: RequestContext & { user: UserOf<C> },
) => Promise<z.input<C['response']>> | z.input<C['response']>;

export interface RouteOptions {
  /** Rate-limit bucket of RATE_LIMITS (@was/shared), per user or IP. */
  rateLimit?: RateLimitKey;
}
export interface RouteDefinition {
  contract: ApiContract;
  handler: ContractHandler<ApiContract>;
  options: RouteOptions;
}

/** One endpoint = one shared contract + one handler. Method, path, access and every schema come from the contract. */
export const defineRoute = <C extends ApiContract>(contract: C, handler: ContractHandler<C>, options: RouteOptions = {}): RouteDefinition => ({
  contract,
  handler: handler as unknown as ContractHandler<ApiContract>,
  options,
});

const parsePart = (schema: z.ZodType | undefined, value: unknown, part: string): unknown => {
  if (!schema) return undefined;
  const result = schema.safeParse(value);
  if (!result.success) throw invalidFields(fieldErrorsOf(result.error, part === 'body' ? undefined : part));
  return result.data;
};

const readBody = async (c: Context): Promise<unknown> => {
  const text = await c.req.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw httpError(400, ApiErrorCode.Validation, 'invalidJson');
  }
};

/**
 * Registers routes on Hono, generically: access rule (shared `accessDenial`) → rate limit → params/query/body
 * validated with the contract schemas (422 with field errors) → handler → response parsed by `contract.response`
 * (drift = 500 + log, never a silently wrong payload).
 */
export const registerRoutes = (app: Hono<HonoEnv>, routes: readonly RouteDefinition[]): void => {
  for (const { contract, handler, options } of routes) {
    app.on(contract.method, contract.path, async (c) => {
      const request = c.get('request');
      const denial = accessDenial(contract.access, request.session.kind, !!request.session.user?.bannedAt, request.locale);
      if (denial) throw new HttpError(denial.status, denial.body);
      // Accounts must come with an e-mail the identity provider verified (Google always does; doc 05).
      if (contract.access !== ApiAccess.Public && request.session.user && !request.session.user.emailVerified) throw forbidden(ApiErrorCode.EmailUnverified, 'emailUnverified');
      if (options.rateLimit) request.deps.rateLimiter.hit(options.rateLimit, request.session.user?.id ?? request.ipHash);

      const input = {
        params: parsePart(contract.params, c.req.param(), 'params'),
        query: parsePart(contract.query, c.req.query(), 'query'),
        body: contract.body ? parsePart(contract.body, await readBody(c), 'body') : undefined,
      } as ContractInputOf<ApiContract>;
      const result = await handler(input, { ...request, user: request.session.user as AuthUser });

      const parsed = contract.response.safeParse(result);
      if (!parsed.success) {
        console.error(`[contract] ${contract.method} ${contract.path} response drift`, parsed.error.issues.slice(0, 5));
        throw httpError(500, ApiErrorCode.Internal, 'internal');
      }
      return c.json(parsed.data as object, 200);
    });
  }
};
