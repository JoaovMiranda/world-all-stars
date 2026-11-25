import { AdminDecision, TIER_VOTE_ANOMALY_MIN_VOTES, type TierVoteFlag, TierVoteFlagStatus } from '@was/shared';
import { useState } from 'react';

import { reviewTierVoteFlag } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { Button } from '@/shared-ui/button.component';
import { ConfirmDialog } from '@/shared-ui/confirm-dialog.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { formatDate } from '@/shared-ui/format.helper';
import { Notice } from '@/shared-ui/notice.component';
import { Section } from '@/shared-ui/section.component';
import { Tag } from '@/shared-ui/tag.component';

import { ADMIN_MESSAGES } from './admin.const';
import { ADMIN_REASON } from './admin-queue.const';
import { TIER_VOTE_FLAGS_MESSAGES } from './tier-vote-flags.const';

/** A1 · accounts flagged by the tier-vote anomaly rule (T3.2): evidence + clear / reject with a reason. */
export function TierVoteFlags({ flags }: { flags: readonly TierVoteFlag[] }) {
  const T = useText(TIER_VOTE_FLAGS_MESSAGES);
  const common = useText(ADMIN_MESSAGES).common;
  const review = reviewTierVoteFlag.useMutation();
  const [deciding, setDeciding] = useState<{ flag: TierVoteFlag; decision: AdminDecision } | null>(null);
  const approve = deciding?.decision === AdminDecision.Approve;
  return (
    <Section title={T.title} eyebrow={String(flags.filter((f) => f.status === TierVoteFlagStatus.Pending).length)}>
      <Notice tone="info">{T.rule(TIER_VOTE_ANOMALY_MIN_VOTES)}</Notice>
      <DataTable
        caption={T.caption}
        emptyText={T.empty}
        rows={[...flags]}
        rowKey={(f) => f.id}
        columns={[
          { key: 'account', header: T.account, cell: (f) => <b>{f.account}</b>, sortValue: (f) => f.account },
          { key: 'created', header: T.created, cell: (f) => formatDate(f.accountCreatedAt.slice(0, 10)), sortValue: (f) => f.accountCreatedAt },
          { key: 'athlete', header: common.athlete, cell: (f) => f.athlete?.knownAs ?? '—' },
          { key: 'burst', header: T.burst, cell: (f) => f.burstVotes, align: 'end' },
          { key: 'votes', header: T.accountVotes, cell: (f) => f.accountVotes, sortValue: (f) => f.accountVotes, align: 'end' },
          {
            key: 'status',
            header: T.status,
            cell: (f) => <Tag tone={f.status === TierVoteFlagStatus.Pending ? 'gold' : 'soft'}>{T.statuses[f.status]}</Tag>,
            sortValue: (f) => f.status,
          },
          {
            key: 'action',
            header: common.actions,
            cell: (f) =>
              f.status === TierVoteFlagStatus.Pending ? (
                <span className="row">
                  <Button size="sm" onClick={() => setDeciding({ flag: f, decision: AdminDecision.Approve })} aria-label={T.clearTitle(f.account)}>
                    {T.clear}
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setDeciding({ flag: f, decision: AdminDecision.Reject })}
                    aria-label={T.rejectTitle(f.account)}
                  >
                    {T.reject}
                  </Button>
                </span>
              ) : null,
          },
        ]}
      />
      <ConfirmDialog
        open={deciding !== null}
        onClose={() => setDeciding(null)}
        title={deciding ? (approve ? T.clearTitle(deciding.flag.account) : T.rejectTitle(deciding.flag.account)) : ''}
        confirmLabel={approve ? T.clear : T.reject}
        confirmVariant={approve ? 'primary' : 'danger'}
        reason={ADMIN_REASON}
        onConfirm={async (reason) => {
          if (!deciding) return;
          await review.mutateAsync({ params: { id: deciding.flag.id }, body: { decision: deciding.decision, reason } });
        }}
      >
        <p>{approve ? T.clearText : T.rejectText}</p>
      </ConfirmDialog>
    </Section>
  );
}
