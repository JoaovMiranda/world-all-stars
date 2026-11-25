import { buildQueryString } from '../helpers/api-contract.helper';

/**
 * Query string of a canonical URL: the params that change the content (filters, page > 1) in a stable order, without
 * the ones that only reorder it (`sort`). Empty values are dropped; returns '' when nothing is left.
 */
export const canonicalQuery = (search: Readonly<Record<string, unknown>>, dropKeys: readonly string[]): string =>
  buildQueryString(
    Object.fromEntries(
      Object.keys(search)
        .sort()
        .filter((key) => !dropKeys.includes(key) && !(key === 'page' && Number(search[key]) <= 1))
        .map((key) => [key, search[key]]),
    ),
  );
