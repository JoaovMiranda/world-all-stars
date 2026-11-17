import { FixtureMode } from '@was/shared';
import type { DataTag, QueryClient } from '@tanstack/react-query';
import { notFound } from '@tanstack/react-router';

import { isApiError } from '@/data/api-error.error';
import { DATA_SOURCE } from '@/data/data-layer.const';
import { fixtureModeStore } from '@/data/fixture-mode.store';

import { IS_SERVER } from './request-scope';

/** Options built by an endpoint (`xQuery.queryOptions(input)`): the key carries the data type. */
interface EndpointQueryOptions {
  queryKey: readonly unknown[];
}
type DataOf<O> = O extends { queryKey: DataTag<unknown, infer D, unknown> } ? D : unknown;
type FetchOptions = Parameters<QueryClient['fetchQuery']>[0];

/** `?fixture=loading` never resolves: loaders must not wait for it (the page shows its skeleton). */
const skipPrefetch = () => DATA_SOURCE === 'fixtures' && fixtureModeStore.get() === FixtureMode.Loading;

/**
 * Server: a failed query is dropped from the cache, so the render shows the same skeleton the browser shows while
 * it fetches again after hydration (errors are not dehydrated).
 */
const dropFailed = (client: QueryClient) => {
  if (IS_SERVER) client.removeQueries({ predicate: (q) => q.state.status === 'error' });
};

/**
 * THE way a route loader loads data: warms the React Query cache with the exact options (keys) the page uses, so the
 * server renders with data and the browser hydrates the same cache. Never throws.
 */
export const prefetchQueries = async (client: QueryClient, queries: readonly EndpointQueryOptions[]): Promise<void> => {
  if (skipPrefetch()) return;
  await Promise.all(queries.map((q) => client.prefetchQuery(q as Parameters<QueryClient['prefetchQuery']>[0])));
  dropFailed(client);
};

/** Like `prefetchQueries` for the main entity of a page: returns it, and a 404 becomes the route's not-found (HTTP 404). */
export const ensureOr404 = async <O extends EndpointQueryOptions>(client: QueryClient, query: O): Promise<DataOf<O> | undefined> => {
  if (skipPrefetch()) return undefined;
  try {
    return (await client.fetchQuery(query as FetchOptions)) as DataOf<O>;
  } catch (error) {
    if (isApiError(error) && error.status === 404) throw notFound();
    dropFailed(client);
    return undefined;
  }
};
