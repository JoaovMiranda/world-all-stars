import { useNavigate, useSearch } from '@tanstack/react-router';
import { useCallback, useMemo } from 'react';
import type { z } from 'zod';

type AnyObjectSchema = z.ZodObject<z.ZodRawShape>;

const compact = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '' && !(Array.isArray(v) && v.length === 0)));

/**
 * Filters (or any UI state: tab, sort) kept in the URL search params, typed and sanitized by a shared schema
 * (e.g. AthleteFiltersSchema). Updates replace the history entry; empty values disappear from the URL.
 */
export function useUrlFilters<S extends AnyObjectSchema>(schema: S) {
  const search = useSearch({ strict: false }) as Record<string, unknown>;
  const navigate = useNavigate();
  const filters = useMemo(() => schema.parse(search) as z.output<S>, [schema, search]);
  const keys = useMemo(() => Object.keys(schema.shape), [schema]);

  const setFilters = useCallback(
    (patch: Partial<z.output<S>>) =>
      void navigate({ to: '.', search: ((prev: Record<string, unknown>) => compact({ ...prev, ...patch })) as never, replace: true, resetScroll: false }),
    [navigate],
  );
  const setFilter = useCallback(<K extends keyof z.output<S>>(key: K, value: z.output<S>[K] | undefined) => setFilters({ [key]: value } as Partial<z.output<S>>), [setFilters]);
  const reset = useCallback(
    () =>
      void navigate({
        to: '.',
        search: ((prev: Record<string, unknown>) => compact(Object.fromEntries(Object.entries(prev).filter(([k]) => !keys.includes(k))))) as never,
        replace: true,
        resetScroll: false,
      }),
    [navigate, keys],
  );
  const activeCount = Object.values(compact(filters as Record<string, unknown>)).length;

  return { filters, setFilter, setFilters, reset, activeCount };
}
