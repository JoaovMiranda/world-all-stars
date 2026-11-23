import { AdminDecision, type CrawlerProposal, ReviewStatus } from '@was/shared';

import { adminProposalsQuery, reviewProposal } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { DiffView } from '@/shared-ui/diff-view.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tag } from '@/shared-ui/tag.component';

import { ADMIN_MESSAGES } from './admin.const';
import { formatDateTime } from './admin-format.helper';
import { ADMIN_REASON } from './admin-queue.const';
import { filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import type { QueueState } from './queue-state.type';
import { SourceLink } from './source-link.component';
import { StatusTag } from './status-tag.component';
import { useAdminMeta } from './use-admin-meta.hook';

const statusOf = (p: CrawlerProposal) => p.status;

function ProposalDetail({ p }: { p: CrawlerProposal }) {
  const T = useText(ADMIN_MESSAGES).review;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const review = reviewProposal.useMutation();
  const decide = (decision: AdminDecision) => (reason: string) => review.mutateAsync({ params: { id: p.id }, body: { decision, reason } });
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={meta.reviewStatus[p.status]} />
        {p.extractedByAi ? <Tag tone="info">{T.aiBadge}</Tag> : <Tag>{T.conflictBadge}</Tag>}
      </div>
      <h2>{p.entity.label}</h2>
      <FactList
        variant="split"
        items={[
          { key: 'field', term: T.field, detail: <code className="admin-wrap">{p.field}</code> },
          { key: 'source', term: adminText.common.source, detail: <SourceLink source={p.source} /> },
          { key: 'created', term: adminText.common.created, detail: formatDateTime(p.createdAt) },
          ...(p.model ? [{ key: 'model', term: T.model, detail: p.model }] : []),
          ...(p.skippedAtGate ? [{ key: 'gate', term: T.skippedAt, detail: p.skippedAtGate }] : []),
        ]}
      />
      <DiffView
        base={p.base}
        current={p.current}
        proposed={p.proposed}
        proposedNote={
          p.extractedByAi &&
          (p.evidenceQuote ? (
            <blockquote className="admin-quote" aria-label={T.evidence}>
              “{p.evidenceQuote}”{p.source && <cite>{p.source.name}</cite>}
            </blockquote>
          ) : (
            <small className="muted">{T.noEvidence}</small>
          ))
        }
      />
      {p.reviewNote && (
        <Notice>
          <b>{adminText.common.reviewNote}:</b> {p.reviewNote}
        </Notice>
      )}
      {p.status === ReviewStatus.Pending ? (
        <DecisionBar
          label={T.decisionLabel}
          actions={[
            {
              key: 'approve',
              label: T.approve,
              variant: 'primary',
              confirmTitle: T.approveTitle,
              reason: ADMIN_REASON,
              onConfirm: decide(AdminDecision.Approve),
            },
            { key: 'reject', label: T.reject, variant: 'danger', confirmTitle: T.rejectTitle, reason: ADMIN_REASON, onConfirm: decide(AdminDecision.Reject) },
          ]}
        />
      ) : (
        <p className="muted">{T.decidedHint}</p>
      )}
    </div>
  );
}

/** A1 · crawler/AI proposals: status chips + queue + 3-way diff with evidence quote and approve/reject with reason. */
export function ProposalQueue({ state }: { state: QueueState }) {
  const T = useText(ADMIN_MESSAGES).review;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const query = adminProposalsQuery.useQuery();
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
      {({ items }) => {
        const status = pickStatus(meta.reviewStatus, state.status);
        const shown = filterByStatus(items, status, statusOf);
        return (
          <div className="stack">
            <StatusFilter
              label={adminText.common.statusFilter}
              options={statusOptions(meta.reviewStatus, items, statusOf)}
              value={status}
              total={items.length}
              onChange={state.setStatus}
            />
            <ReviewQueue
              label={T.queueLabel}
              items={shown}
              getKey={(p) => p.id}
              selectedKey={state.item}
              onSelect={state.setItem}
              emptyTitle={T.empty}
              emptyText={T.emptyText}
              renderItem={(p) => (
                <>
                  <span className="review-queue-item-head">
                    <b>{p.entity.label}</b>
                    <StatusTag meta={meta.reviewStatus[p.status]} />
                  </span>
                  <small className="admin-wrap">
                    {p.field}
                    {p.extractedByAi && ` · ${T.aiBadge}`}
                  </small>
                </>
              )}
              renderDetail={(p) => <ProposalDetail key={p.id} p={p} />}
            />
          </div>
        );
      }}
    </QueryBoundary>
  );
}
