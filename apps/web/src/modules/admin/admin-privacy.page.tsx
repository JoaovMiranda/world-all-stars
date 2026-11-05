import { PRIVACY_RESPONSE_DAYS, type PrivacyRequest, PrivacyRequestStatus, privacyDeadlineOf } from '@was/shared';

import { adminPrivacyQuery, updatePrivacyRequest } from '@/data/endpoints/admin.query';
import { type DecisionAction, DecisionBar } from '@/shared-ui/decision-bar.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';

import { ADMIN_TEXT } from './admin.const';
import { formatDateTime, formatDay } from './admin-format.helper';
import { DEADLINE_META, PRIVACY_RIGHT_LABEL, PRIVACY_STATUS_META, PRIVACY_SUBJECT_LABEL } from './admin-labels.const';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_REASON, filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import { StatusTag } from './status-tag.component';
import { useQueueState } from './use-queue-state.hook';

const T = ADMIN_TEXT.privacy;
const statusOf = (r: PrivacyRequest) => r.status;
const NOTE = { ...ADMIN_REASON, label: T.noteLabel };

function DeadlineTag({ r }: { r: PrivacyRequest }) {
  const d = privacyDeadlineOf(r);
  return (
    <>
      <StatusTag meta={DEADLINE_META[d.state]} />
      {d.state !== 'closed' && <small className="muted"> {T.daysLeft(d.daysLeft)}</small>}
    </>
  );
}

function PrivacyDetail({ r }: { r: PrivacyRequest }) {
  const update = updatePrivacyRequest.useMutation();
  const to = (status: PrivacyRequestStatus) => (note: string) => update.mutateAsync({ params: { id: r.id }, body: { status, note } });
  const actions: DecisionAction[] = [];
  if (r.status === PrivacyRequestStatus.Open) actions.push({ key: 'start', label: T.start, confirmTitle: T.startTitle, reason: NOTE, onConfirm: to(PrivacyRequestStatus.InProgress) });
  if (r.status === PrivacyRequestStatus.Open || r.status === PrivacyRequestStatus.InProgress) {
    actions.push({ key: 'answer', label: T.answer, variant: 'primary', confirmTitle: T.answerTitle, reason: NOTE, onConfirm: to(PrivacyRequestStatus.Answered) });
    actions.push({ key: 'reject', label: T.reject, variant: 'danger', confirmTitle: T.rejectTitle, reason: NOTE, onConfirm: to(PrivacyRequestStatus.Rejected) });
  }
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={PRIVACY_STATUS_META[r.status]} />
        <DeadlineTag r={r} />
      </div>
      <h2>
        {r.protocol} · {PRIVACY_RIGHT_LABEL[r.right]}
      </h2>
      <FactList
        variant="split"
        items={[
          { key: 'subject', term: T.subject, detail: PRIVACY_SUBJECT_LABEL[r.subjectKind] },
          { key: 'req', term: T.requester, detail: <a href={`mailto:${r.requesterEmail}`} className="admin-wrap">{r.requesterEmail}</a> },
          ...(r.athlete ? [{ key: 'ath', term: T.athlete, detail: r.athlete.knownAs }] : []),
          { key: 'created', term: T.createdAt, detail: formatDateTime(r.createdAt) },
          { key: 'due', term: T.dueAt, detail: formatDay(r.dueAt) },
          ...(r.answeredAt ? [{ key: 'ans', term: T.answeredAt, detail: formatDateTime(r.answeredAt) }] : []),
          ...(r.handledBy ? [{ key: 'by', term: T.handledBy, detail: r.handledBy }] : []),
        ]}
      />
      <div>
        <h3 className="label">{T.details}</h3>
        <p className="admin-wrap">{r.details}</p>
      </div>
      {r.note && (
        <Notice>
          <b>{T.noteLabel}:</b> {r.note}
        </Notice>
      )}
      {actions.length > 0 && <DecisionBar label={T.decisionLabel} actions={actions} />}
    </div>
  );
}

/** A5 Pedidos de privacidade: LGPD queue with legal deadline (15 days). */
export function AdminPrivacyPage() {
  const state = useQueueState();
  const query = adminPrivacyQuery.useQuery();
  return (
    <AdminLayout section="privacy">
      <Notice tone="info">{T.rule(PRIVACY_RESPONSE_DAYS)}</Notice>
      <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
        {({ items }) => {
          const status = pickStatus(PRIVACY_STATUS_META, state.status);
          const closedLast = (r: PrivacyRequest) => Number(privacyDeadlineOf(r).state === 'closed');
          const sorted = [...items].sort((a, b) => closedLast(a) - closedLast(b) || a.dueAt.localeCompare(b.dueAt));
          return (
            <div className="stack">
              <StatusFilter label={ADMIN_TEXT.common.statusFilter} options={statusOptions(PRIVACY_STATUS_META, items, statusOf)} value={status} total={items.length} onChange={state.setStatus} />
              <ReviewQueue
                label={T.queueLabel}
                items={filterByStatus(sorted, status, statusOf)}
                getKey={(r) => r.id}
                selectedKey={state.item}
                onSelect={state.setItem}
                emptyTitle={T.empty}
                emptyText={T.emptyText}
                renderItem={(r) => (
                  <>
                    <span className="review-queue-item-head">
                      <b>
                        {r.protocol} · {PRIVACY_RIGHT_LABEL[r.right]}
                      </b>
                      <StatusTag meta={PRIVACY_STATUS_META[r.status]} />
                    </span>
                    <small>
                      <DeadlineTag r={r} />
                    </small>
                  </>
                )}
                renderDetail={(r) => <PrivacyDetail key={r.id} r={r} />}
              />
            </div>
          );
        }}
      </QueryBoundary>
    </AdminLayout>
  );
}
