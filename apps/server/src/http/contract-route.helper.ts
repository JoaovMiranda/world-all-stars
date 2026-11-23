import { ApiAccess, type ApiContract, ApiErrorCode, accessDenial, type Locale, zodErrorMap } from '@was/shared';
import type { Context, Hono } from 'hono';
import type { z } from 'zod';

import type { AuthUser } from '../auth/auth-provider.type';
import type { HonoEnv } from './app-context.type';
import type { ContractHandler } from './contract-handler.type';
import type { ContractInputOf } from './contract-input-of.interface';
import { HttpError } from './http-error.error';
import { forbidden, httpError, invalidFields } from './http-error.helper';
import type { RouteDefinition } from './route-definition.interface';
import type { RouteOptions } from './route-options.interface';
import { fieldErrorsOf } from './zod-errors.helper';

/** One endpoint = one shared contract + one handler. Method, path, access and every schema come from the contract. */
export const defineRoute = <C extends ApiContract>(contract: C, handler: ContractHandler<C>, options: RouteOptions = {}): RouteDefinition => ({
  contract,
  handler: handler as unknown as ContractHandler<ApiContract>,
  options,
});

/** Generic Zod messages (required, too long, invalid e-mail…) come in the request language (zodErrorMap). */
const parsePart = (schema: z.ZodType | undefined, value: unknown, part: string, locale: Locale): unknown => {
  if (!schema) return undefined;
  const result = schema.safeParse(value, { error: zodErrorMap(locale) });
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
      if (contract.access !== ApiAccess.Public && request.session.user && !request.session.user.emailVerified)
        throw forbidden(ApiErrorCode.EmailUnverified, 'emailUnverified');
      if (options.rateLimit) await request.deps.rateLimiter.hit(options.rateLimit, request.session.user?.id ?? request.ipHash);

      const input = {
        params: parsePart(contract.params, c.req.param(), 'params', request.locale),
        query: parsePart(contract.query, c.req.query(), 'query', request.locale),
        body: contract.body ? parsePart(contract.body, await readBody(c), 'body', request.locale) : undefined,
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
