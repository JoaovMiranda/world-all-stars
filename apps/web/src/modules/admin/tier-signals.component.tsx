import { TIER_SIGNAL_MIN_SHARE, TIER_SIGNAL_MIN_VOTES, TIER_VALUES, type Tier, type TierSignal } from '@was/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { adminSummaryQuery, adminTierSignalsQuery } from '@/data/endpoints/admin.query';
import { setOfficialTier } from '@/data/endpoints/tier-votes.query';
import { Button } from '@/shared-ui/button.component';
import { ConfirmDialog } from '@/shared-ui/confirm-dialog.component';
import { DataTable } from '@/shared-ui/data-table.component';
import { TIER_LABEL } from '@/shared-ui/domain-labels.const';
import { FormField } from '@/shared-ui/form-field.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { Select } from '@/shared-ui/select.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tag } from '@/shared-ui/tag.component';
import { TierTag } from '@/shared-ui/tier-tag.component';

import { ADMIN_TEXT } from './admin.const';
import { formatPercent } from './admin-format.helper';
import { ADMIN_REASON } from './admin-queue.helper';
import type { QueueState } from './queue-state.type';

const T = ADMIN_TEXT.tiers;
const SIGNALS = 'signals';
const tierOptions = TIER_VALUES.map((t) => ({ value: t, label: TIER_LABEL[t] }));

/** Dialog to change the official tier (reason required; Mythic refused without an approved dossier, doc 17). */
function ChangeTierDialog({ row, onClose }: { row: TierSignal | null; onClose: () => void }) {
  const client = useQueryClient();
  const mutation = setOfficialTier.useMutation({
    onSuccess: () => Promise.all([adminTierSignalsQuery, adminSummaryQuery].map((q) => client.invalidateQueries({ queryKey: q.baseKey }))),
  });
  const [tier, setTier] = useState<Tier | ''>('');
  return (
    <ConfirmDialog
      open={row !== null}
      onClose={() => (setTier(''), onClose())}
      title={row ? T.changeTitle(row.athlete.knownAs) : ''}
      confirmLabel={T.change}
      reason={ADMIN_REASON}
      onConfirm={async (reason) => {
        if (!row || !tier || tier === row.official) throw new Error(T.sameTier);
        await mutation.mutateAsync({ params: { slug: row.athlete.slug }, body: { tier, reason } });
      }}
    >
      <FormField label={T.newTier} hint={T.mythicHint} required>
        {(p) => <Select {...p} value={tier || row?.topOther || ''} onChange={(e) => setTier(e.target.value as Tier)} options={tierOptions} />}
      </FormField>
    </ConfirmDialog>
  );
}

/** A1 · "Sinais de tier": readers' votes vs the official tier, with the change-tier action. */
export function TierSignals({ state }: { state: QueueState }) {
  const query = adminTierSignalsQuery.useQuery();
  const [editing, setEditing] = useState<TierSignal | null>(null);
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={8} />}>
      {({ items }) => {
        const onlySignals = state.status === SIGNALS;
        const signals = items.filter((s) => s.isSignal).length;
        return (
          <div className="stack">
            <Notice tone="info">{T.rule(TIER_SIGNAL_MIN_VOTES, formatPercent(TIER_SIGNAL_MIN_SHARE))}</Notice>
            <StatusFilter
              label={T.filterLabel}
              allLabel={T.all}
              total={items.length}
              options={[{ value: SIGNALS, label: T.onlySignals, count: signals }]}
              value={onlySignals ? SIGNALS : undefined}
              onChange={state.setStatus}
            />
            <DataTable
              caption={T.caption}
              emptyText={T.empty}
              rows={onlySignals ? items.filter((s) => s.isSignal) : items}
              rowKey={(s) => s.athlete.slug}
              columns={[
                { key: 'athlete', header: ADMIN_TEXT.common.athlete, cell: (s) => <b>{s.athlete.knownAs}</b>, sortValue: (s) => s.athlete.knownAs },
                { key: 'official', header: T.official, cell: (s) => <TierTag tier={s.official} /> },
                { key: 'most', header: T.mostVoted, cell: (s) => (s.mostVoted ? <TierTag tier={s.mostVoted} /> : T.noSignal) },
                { key: 'other', header: T.topOther, cell: (s) => (s.topOther ? `${TIER_LABEL[s.topOther]} · ${formatPercent(s.topOtherShare)}` : T.noSignal), sortValue: (s) => s.topOtherShare },
                { key: 'votes', header: T.votes, cell: (s) => s.total, sortValue: (s) => s.total, align: 'end' },
                { key: 'signal', header: T.signal, cell: (s) => (s.isSignal ? <Tag tone="gold">{T.signal}</Tag> : T.noSignal), sortValue: (s) => Number(s.isSignal) },
                { key: 'action', header: ADMIN_TEXT.common.actions, cell: (s) => <Button size="sm" onClick={() => setEditing(s)} aria-label={T.changeTitle(s.athlete.knownAs)}>{T.change}</Button> },
              ]}
            />
            <ChangeTierDialog row={editing} onClose={() => setEditing(null)} />
          </div>
        );
      }}
    </QueryBoundary>
  );
}
