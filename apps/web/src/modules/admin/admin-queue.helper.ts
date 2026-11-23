import type { StatusFilterOption } from '@/shared-ui/status-filter-option.interface';
import type { StatusMeta } from './status-meta.interface';

/**
 * Options of a StatusFilter with counters, from a status → meta map and the queue items. Only statuses that are
 * in the map are offered; `value` from the URL is validated against them.
 */
export const statusOptions = <S extends string, T>(meta: Record<S, StatusMeta>, items: readonly T[], statusOf: (item: T) => S): StatusFilterOption<S>[] =>
  (Object.keys(meta) as S[]).map((value) => ({ value, label: meta[value].label, count: items.filter((i) => statusOf(i) === value).length }));

/** Status from the URL, only if it is one of the map keys. */
export const pickStatus = <S extends string>(meta: Record<S, StatusMeta>, raw: string | undefined): S | undefined =>
  raw !== undefined && raw in meta ? (raw as S) : undefined;

/** Items of the selected status (all when undefined). */
export const filterByStatus = <S extends string, T>(items: readonly T[], status: S | undefined, statusOf: (item: T) => S): T[] =>
  status ? items.filter((i) => statusOf(i) === status) : [...items];
