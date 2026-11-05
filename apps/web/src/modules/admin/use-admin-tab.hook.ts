import { useCallback } from 'react';
import type { z } from 'zod';

import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

type TabSearchSchema = z.ZodObject<z.ZodRawShape & { tab: z.ZodType }>;

/** Active tab of an admin page (`?tab=`, first value by default); switching tab clears the queue status and selection. */
export function useAdminTab<V extends string>(schema: TabSearchSchema, values: readonly [V, ...V[]]) {
  const { filters, setFilters } = useUrlFilters(schema);
  const tab = ((filters as { tab?: V }).tab ?? values[0]) as V;
  const setTab = useCallback((next: V) => setFilters({ tab: next, status: undefined, item: undefined, q: undefined } as never), [setFilters]);
  return { tab, setTab };
}
