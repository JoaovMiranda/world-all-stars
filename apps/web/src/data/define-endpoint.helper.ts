import { type ApiContract, type ContractInput, type ContractResponse, FixtureMode, type Locale, type SessionKind } from '@was/shared';
import { queryOptions, type UseMutationOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { getScope } from '@/app/request-scope';
import { localeStore, useLocale } from '@/i18n/locale.store';
import { sessionStore, useSessionKind } from '@/session/session.store';

import type { FixtureHandler } from './fixture-context.type';
import { DATA_SOURCE } from './data-layer.const';
import { fixtureModeStore, useFixtureMode } from './fixture-mode.store';
import { httpRequest } from './http-client.helper';
import { type FixtureOptions, runFixture } from './run-fixture.helper';

/** Input argument: optional when the contract has no params/query/body. */
type InputArgs<C extends ApiContract> = object extends ContractInput<C> ? [input?: ContractInput<C>] : [input: ContractInput<C>];
/** Extra options of `useQuery` (e.g. `enabled: isSignedIn`). */
export interface QueryExtra {
  enabled?: boolean;
}
type HookArgs<C extends ApiContract> = object extends ContractInput<C>
  ? [input?: ContractInput<C>, extra?: QueryExtra]
  : [input: ContractInput<C>, extra?: QueryExtra];

const call = async <C extends ApiContract>(contract: C, fixture: FixtureOptions<C>, input: unknown, mode: FixtureMode, signal?: AbortSignal) => {
  const raw =
    DATA_SOURCE === 'http'
      ? await httpRequest(contract, (input ?? {}) as Record<string, never>, signal)
      : await runFixture(contract, fixture, input ?? {}, mode, signal);
  // The shared contract is the single source of truth: drift fails loudly here, in dev and in prod.
  return contract.response.parse(raw) as ContractResponse<C>;
};

/** True when `previous` is the same query in another language (the key minus its last item, the locale). */
const sameButLocale = (previous: readonly unknown[], current: readonly unknown[]): boolean =>
  previous.length === current.length + 1 && JSON.stringify(previous.slice(0, -1)) === JSON.stringify(current);

/**
 * ONE definition per GET endpoint → typed queryKey/queryOptions/useQuery/fetch, served by the real API
 * (VITE_DATA_SOURCE=http) or by fixtures (?fixture=sample|empty|loading|error). Replaces service/adapter/hook triplets.
 */
export function defineQuery<C extends ApiContract>(contract: C, fixture: FixtureOptions<C>) {
  /** Prefix shared by every key of this endpoint (use it to invalidate). */
  const baseKey = [contract.method, contract.path] as const;
  const options = (
    input: ContractInput<C> | undefined,
    mode: FixtureMode = fixtureModeStore.get(),
    session: SessionKind = sessionStore.get(),
    locale: Locale = localeStore.get(),
  ) =>
    queryOptions({
      // The locale is part of the key: the API answers in it (labels, translated content, contentLocale).
      queryKey: [...baseKey, input ?? {}, mode, session, locale] as const,
      queryFn: ({ signal }) => call(contract, fixture, input, mode, signal),
      // A language switch keeps showing the previous answer while the new one loads (no skeleton flash).
      placeholderData: (previous, previousQuery) => (previousQuery && sameButLocale(previousQuery.queryKey, [...baseKey, input ?? {}, mode, session]) ? previous : undefined),
      ...(mode === FixtureMode.Error ? { retry: false } : {}),
    });

  return {
    contract,
    baseKey,
    queryOptions: (...[input]: InputArgs<C>) => options(input),
    /** Imperative fetch through the cache of the current request (server) or of the browser. */
    fetch(...[input]: InputArgs<C>) {
      const client = getScope().queryClient;
      if (!client) throw new Error('No QueryClient in the request scope');
      return client.fetchQuery(options(input));
    },
    /** React hook. Re-runs when the fixture mode, the simulated session or the language changes. */
    useQuery(...[input, extra]: HookArgs<C>) {
      const mode = useFixtureMode();
      const session = useSessionKind();
      const locale = useLocale();
      return useQuery({ ...options(input, mode, session, locale), ...(extra ?? {}) });
    },
  };
}
export type QueryEndpoint = ReturnType<typeof defineQuery<ApiContract>>;

/**
 * ONE definition per write endpoint → typed useMutation/mutate. On success it invalidates the listed queries.
 * In fixture mode the handler writes to the demo store (memory + localStorage).
 */
export function defineMutation<C extends ApiContract>(contract: C, handler: FixtureHandler<C>, config: { invalidates?: readonly { baseKey: readonly unknown[] }[] } = {}) {
  const fixture: FixtureOptions<C> = { sample: handler };
  const mutate = (input: ContractInput<C>) => call(contract, fixture, input, fixtureModeStore.get());
  return {
    contract,
    mutate,
    useMutation(options: Omit<UseMutationOptions<ContractResponse<C>, Error, ContractInput<C>>, 'mutationFn'> = {}) {
      const client = useQueryClient();
      return useMutation({
        ...options,
        mutationFn: mutate,
        onSuccess: async (...args) => {
          await Promise.all((config.invalidates ?? []).map((e) => client.invalidateQueries({ queryKey: e.baseKey })));
          await options.onSuccess?.(...args);
        },
      });
    },
  };
}
