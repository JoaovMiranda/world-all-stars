import type { RankingSnapshotSummary } from '@was/shared';

import { adminRankingsQuery, approveRanking, calculateRanking, rankingMethodologiesQuery, revertRanking } from '@/data/endpoints/rankings.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { Tag } from '@/shared-ui/tag.component';

import { ADMIN_MESSAGES } from './admin.const';
import { ADMIN_REASON } from './admin-queue.const';

function SnapshotRow({ s }: { s: RankingSnapshotSummary }) {
  const T = useText(ADMIN_MESSAGES).rankings;
  const approve = approveRanking.useMutation();
  const revert = revertRanking.useMutation();
  return (
    <li className="admin-detail">
      <div className="admin-detail-head">
        <Tag tone={s.status === 'published' ? 'info' : 'soft'}>{T.status[s.status] ?? s.status}</Tag>
        <Tag tone="soft">{T.approvals(s.approvals, s.approvalsRequired)}</Tag>
        <Tag tone="soft">{T.entries(s.entries)}</Tag>
      </div>
      <b>{s.title}</b> <code className="muted">{s.outputHash.slice(0, 12)}</code>
      {s.status === 'calculated' && (
        <DecisionBar
          label={T.decisionLabel}
          actions={[
            {
              key: 'approve',
              label: T.approve,
              variant: 'primary',
              confirmTitle: T.approveTitle,
              reason: ADMIN_REASON,
              onConfirm: (reason: string) => approve.mutateAsync({ params: { id: s.id }, body: { reason } }),
            },
          ]}
        />
      )}
      {s.status === 'published' && (
        // D12 revert: archive this publication and republish the previous one. Re-authentication arrives in T6.2; until
        // then the confirm dialog requires a reason, which goes to the audit log.
        <DecisionBar
          label={T.decisionLabel}
          actions={[
            {
              key: 'revert',
              label: T.revert,
              variant: 'danger',
              confirmTitle: T.revertTitle,
              reason: ADMIN_REASON,
              onConfirm: (reason: string) => revert.mutateAsync({ params: { id: s.id }, body: { reason } }),
            },
          ]}
        />
      )}
    </li>
  );
}

/** Admin · rankings: calculate candidates per methodology; publish with two approvals by different curators (E04) or
 * automatically when the reproducibility gate passes (D12); revert a publication to the previous snapshot. */
export function RankingAdmin() {
  const T = useText(ADMIN_MESSAGES).rankings;
  const snapshots = adminRankingsQuery.useQuery();
  const methodologies = rankingMethodologiesQuery.useQuery();
  const calculate = calculateRanking.useMutation();
  return (
    <div className="stack">
      <div className="row gap-2">
        {(methodologies.data?.items ?? []).map((m) => (
          <Button key={m.key} size="sm" disabled={calculate.isPending} onClick={() => calculate.mutate({ body: { methodology: m.key } })}>
            {T.calculate(m.key)}
          </Button>
        ))}
      </div>
      <QueryBoundary
        query={snapshots}
        loading={<SkeletonList rows={5} />}
        isEmpty={(d) => d.items.length === 0}
        empty={<EmptyState title={T.empty}>{T.emptyText}</EmptyState>}
      >
        {(data) => (
          <ul className="stack gap-3">
            {data.items.map((s) => (
              <SnapshotRow key={s.id} s={s} />
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
