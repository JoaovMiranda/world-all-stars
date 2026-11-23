import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { isNotFound, isUnauthorized } from '@/data/api-error.error';
import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';

import { Button } from './button.component';
import { EmptyState } from './empty-state.component';
import { ErrorState } from './error-state.component';
import { SkeletonList } from './skeleton.component';
import { UI_MESSAGES } from './ui-text.const';

interface QueryBoundaryProps<T> {
  query: UseQueryResult<T>;
  /** Render the data (only called with data). */
  children: (data: T) => ReactNode;
  /** Loading UI with the final size (default: 4 skeleton rows). */
  loading?: ReactNode;
  /** When true for the data, `empty` is rendered instead of children. */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  /** 404 UI (default: generic "Not found"). */
  notFound?: ReactNode;
  errorTitle?: string;
}

/**
 * ONE component for the four states of any query: loading skeleton · error with retry (401 → sign in, 404 → not
 * found) · empty state · data. `<QueryBoundary query={q} isEmpty={(d) => !d.items.length} empty={…}>{(d) => …}`
 */
export function QueryBoundary<T>({ query, children, loading, isEmpty, empty, notFound, errorTitle }: QueryBoundaryProps<T>) {
  const ui = useText(UI_MESSAGES);
  const { requireLogin } = useSession();
  if (query.isPending) {
    return (
      <div aria-busy="true">
        <p className="sr-only" role="status">
          {ui.loadingLabel}
        </p>
        {loading ?? <SkeletonList />}
      </div>
    );
  }
  if (query.isError) {
    if (isNotFound(query.error))
      return (
        <>
          {notFound ?? (
            <EmptyState title={ui.notFoundTitle} mark="?">
              {ui.notFoundText}
            </EmptyState>
          )}
        </>
      );
    if (isUnauthorized(query.error)) {
      return (
        <EmptyState
          title={ui.signInTitle}
          action={
            <Button variant="primary" onClick={() => requireLogin('account')}>
              {ui.signInAction}
            </Button>
          }
        >
          {ui.signInText}
        </EmptyState>
      );
    }
    return <ErrorState {...(errorTitle ? { title: errorTitle } : {})} onRetry={() => void query.refetch()} isRetrying={query.isFetching} />;
  }
  if (isEmpty?.(query.data)) return <>{empty ?? <EmptyState title={ui.emptyTitle} />}</>;
  return <>{children(query.data)}</>;
}
