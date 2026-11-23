import { Link } from '@tanstack/react-router';
import { AdminDecision, type AdminDossier, DossierStatus } from '@was/shared';

import { adminDossiersQuery, reviewDossier } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { MeterList } from '@/shared-ui/meter-list.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tag } from '@/shared-ui/tag.component';
import { TierTag } from '@/shared-ui/tier-tag.component';

import { ADMIN_MESSAGES } from './admin.const';
import { formatDateTime } from './admin-format.helper';
import { ADMIN_REASON } from './admin-queue.const';
import { filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import type { QueueState } from './queue-state.type';
import { SourceLink } from './source-link.component';
import { StatusTag } from './status-tag.component';
import { useAdminMeta } from './use-admin-meta.hook';

const statusOf = (d: AdminDossier) => d.status;

function DossierDetail({ d }: { d: AdminDossier }) {
  const T = useText(ADMIN_MESSAGES).dossiers;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const { user } = useSession();
  const review = reviewDossier.useMutation();
  const decide = (decision: AdminDecision) => (reason: string) => review.mutateAsync({ params: { id: d.id }, body: { decision, reason } });
  const open = d.status === DossierStatus.Pending || d.status === DossierStatus.Draft;
  const iApproved = Boolean(user && d.approvedBy.includes(user.name));
  const approvals = d.approvedBy.length;
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={meta.dossierStatus[d.status]} />
        <TierTag tier={d.athlete.tier} />
      </div>
      <h2>{d.athlete.knownAs}</h2>
      <p className="admin-quote">{d.headline}</p>
      <MeterList
        label={T.approvals(approvals, d.approvalsRequired)}
        items={[{ key: 'a', label: T.approvedBy, percent: (approvals / d.approvalsRequired) * 100, valueText: T.approvals(approvals, d.approvalsRequired) }]}
      />
      <FactList
        variant="split"
        items={[
          { key: 'by', term: T.approvedBy, detail: d.approvedBy.length ? d.approvedBy.join(', ') : T.nobody },
          { key: 'updated', term: adminText.common.updated, detail: formatDateTime(d.updatedAt) },
          {
            key: 'profile',
            term: adminText.common.athlete,
            detail: (
              <Link to="/athletes/$slug" params={{ slug: d.athlete.slug }}>
                {T.profile}
                <span className="sr-only">: {d.athlete.knownAs}</span>
              </Link>
            ),
          },
        ]}
      />
      <div>
        <h3 className="label">{T.evidences}</h3>
        {d.evidences.length ? (
          <ol className="admin-list">
            {d.evidences.map((e) => (
              <li key={e.id}>
                <Tag tone="soft">{meta.evidenceType[e.type]}</Tag>
                {e.description && <p className="mb-1 mt-2">{e.description}</p>}
                <SourceLink source={e.source} />
              </li>
            ))}
          </ol>
        ) : (
          <Notice tone="warning">{T.noEvidences}</Notice>
        )}
      </div>
      {d.reviewNote && (
        <Notice>
          <b>{adminText.common.reviewNote}:</b> {d.reviewNote}
        </Notice>
      )}
      {open && (
        <>
          {iApproved && <Notice tone="info">{T.alreadyApproved}</Notice>}
          <DecisionBar
            label={T.decisionLabel}
            actions={[
              {
                key: 'approve',
                label: T.approve,
                variant: 'primary',
                disabled: iApproved || !d.evidences.length,
                confirmTitle: T.approveTitle,
                confirmBody: <p className="muted">{T.approveText}</p>,
                reason: ADMIN_REASON,
                onConfirm: decide(AdminDecision.Approve),
              },
              { key: 'reject', label: T.reject, variant: 'danger', confirmTitle: T.rejectTitle, reason: ADMIN_REASON, onConfirm: decide(AdminDecision.Reject) },
            ]}
          />
        </>
      )}
    </div>
  );
}

/** A6 (also the "Dossiês" tab of A1): headline, evidences with source, 2-admin approval. */
export function DossierQueue({ state }: { state: QueueState }) {
  const T = useText(ADMIN_MESSAGES).dossiers;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const query = adminDossiersQuery.useQuery();
  return (
    <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
      {({ items }) => {
        const status = pickStatus(meta.dossierStatus, state.status);
        return (
          <div className="stack">
            <StatusFilter
              label={adminText.common.statusFilter}
              options={statusOptions(meta.dossierStatus, items, statusOf)}
              value={status}
              total={items.length}
              onChange={state.setStatus}
            />
            <ReviewQueue
              label={T.queueLabel}
              items={filterByStatus(items, status, statusOf)}
              getKey={(d) => d.id}
              selectedKey={state.item}
              onSelect={state.setItem}
              emptyTitle={T.empty}
              emptyText={T.emptyText}
              renderItem={(d) => (
                <>
                  <span className="review-queue-item-head">
                    <b>{d.athlete.knownAs}</b>
                    <StatusTag meta={meta.dossierStatus[d.status]} />
                  </span>
                  <small>{T.approvals(d.approvedBy.length, d.approvalsRequired)}</small>
                </>
              )}
              renderDetail={(d) => <DossierDetail key={d.id} d={d} />}
            />
          </div>
        );
      }}
    </QueryBoundary>
  );
}
