import { AdminQueueSearchSchema } from '@was/shared';
import { useMemo } from 'react';

import { useUrlFilters } from '@/shared-ui/use-url-filters.hook';

import type { QueueState } from './queue-state.type';

/** Status filter + selected item of an admin queue, kept in the URL (`?status=&item=`). Changing status resets the item. */
export function useQueueState(): QueueState {
  const { filters, setFilters } = useUrlFilters(AdminQueueSearchSchema);
  return useMemo(
    () => ({
      status: filters.status,
      item: filters.item,
      setStatus: (status) => setFilters({ status, item: undefined }),
      setItem: (item) => setFilters({ item }),
    }),
    [filters.status, filters.item, setFilters],
  );
}
