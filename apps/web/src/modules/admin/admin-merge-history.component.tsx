import type { MergeHistoryItem } from '@was/shared';

import { mergeHistoryQuery, unmergeEntities } from '@/data/endpoints/admin-merge.query';
import { useText } from '@/i18n/use-text.hook';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { formatDateTime } from './admin-format.helper';
import { ADMIN_MERGE_MESSAGES } from './admin-merge.const';
import { ADMIN_REASON } from './admin-queue.const';

function MergeHistoryRow({ item }: { item: MergeHistoryItem }) {
  const T = useText(ADMIN_MERGE_MESSAGES);
  const unmerge = unmergeEntities.useMutation();
  return (
    <li>
      <div className="merge-history-head">
        <b>
          {item.merged.name} → {item.survivor.name}
        </b>
        <small className="muted">{item.undoneAt ? T.undone : T.active}</small>
      </div>
      <p className="muted">
        {T.mergedAt} {formatDateTime(item.mergedAt)} · {T.moved(item.moved)}
        {item.undoneAt && ` · ${T.undoneAt} ${formatDateTime(item.undoneAt)}`}
      </p>
      <p>
        <span className="muted">{T.reasonColumn}: </span>
        {item.reason}
      </p>
      {item.undoReason && (
        <p>
          <span className="muted">{T.undoReason}: </span>
          {item.undoReason}
        </p>
      )}
      {!item.undoneAt && (
        <DecisionBar
          label={T.actionsLabel(item.merged.name)}
          actions={[
            {
              key: 'unmerge',
              label: T.unmerge,
              variant: 'danger',
              confirmTitle: T.unmergeTitle(item.merged.name, item.survivor.name),
              confirmBody: <p>{T.unmergeText}</p>,
              reason: { ...ADMIN_REASON, label: T.undoReason },
              onConfirm: (reason) => unmerge.mutateAsync({ params: { id: item.id }, body: { reason } }),
            },
          ]}
        />
      )}
    </li>
  );
}

/** Merge history, newest first, each active merge with its Undo action (reason required). */
export function MergeHistory() {
  const T = useText(ADMIN_MERGE_MESSAGES);
  const query = mergeHistoryQuery.useQuery();
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={3} />}>
      {({ items }) =>
        items.length ? (
          <ul className="admin-list" aria-label={T.historyLabel}>
            {items.map((item) => (
              <MergeHistoryRow key={item.id} item={item} />
            ))}
          </ul>
        ) : (
          <EmptyState compact title={T.historyEmpty}>
            {T.historyEmptyText}
          </EmptyState>
        )
      }
    </QueryBoundary>
  );
}
