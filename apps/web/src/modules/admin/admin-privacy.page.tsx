import { PRIVACY_RESPONSE_DAYS, type PrivacyRequest, PrivacyRequestStatus, privacyDeadlineOf } from '@was/shared';

import { adminPrivacyQuery, updatePrivacyRequest } from '@/data/endpoints/admin.query';
import { useText } from '@/i18n/use-text.hook';
import type { DecisionAction } from '@/shared-ui/decision-action.interface';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { ADMIN_MESSAGES } from './admin.const';
import { formatDateTime, formatDay } from './admin-format.helper';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_REASON } from './admin-queue.const';
import { filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import { StatusTag } from './status-tag.component';
import { useAdminMeta } from './use-admin-meta.hook';
import { useQueueState } from './use-queue-state.hook';

const statusOf = (r: PrivacyRequest) => r.status;

function DeadlineTag({ r }: { r: PrivacyRequest }) {
  const T = useText(ADMIN_MESSAGES).privacy;
  const meta = useAdminMeta();
  const d = privacyDeadlineOf(r);
  return (
    <>
      <StatusTag meta={meta.deadline[d.state]} />
      {d.state !== 'closed' && <small className="muted"> {T.daysLeft(d.daysLeft)}</small>}
    </>
  );
}

function PrivacyDetail({ r }: { r: PrivacyRequest }) {
  const T = useText(ADMIN_MESSAGES).privacy;
  const meta = useAdminMeta();
  const update = updatePrivacyRequest.useMutation();
  const to = (status: PrivacyRequestStatus) => (note: string) => update.mutateAsync({ params: { id: r.id }, body: { status, note } });
  const actions: DecisionAction[] = [];
  if (r.status === PrivacyRequestStatus.Open)
    actions.push({
      key: 'start',
      label: T.start,
      confirmTitle: T.startTitle,
      reason: { ...ADMIN_REASON, label: T.noteLabel },
      onConfirm: to(PrivacyRequestStatus.InProgress),
    });
  if (r.status === PrivacyRequestStatus.Open || r.status === PrivacyRequestStatus.InProgress) {
    actions.push({
      key: 'answer',
      label: T.answer,
      variant: 'primary',
      confirmTitle: T.answerTitle,
      reason: { ...ADMIN_REASON, label: T.noteLabel },
      onConfirm: to(PrivacyRequestStatus.Answered),
    });
    actions.push({
      key: 'reject',
      label: T.reject,
      variant: 'danger',
      confirmTitle: T.rejectTitle,
      reason: { ...ADMIN_REASON, label: T.noteLabel },
      onConfirm: to(PrivacyRequestStatus.Rejected),
    });
  }
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={meta.privacyStatus[r.status]} />
        <DeadlineTag r={r} />
      </div>
      <h2>
        {r.protocol} · {meta.privacyRight[r.right]}
      </h2>
      <FactList
        variant="split"
        items={[
          { key: 'subject', term: T.subject, detail: meta.privacySubject[r.subjectKind] },
          {
            key: 'req',
            term: T.requester,
            detail: (
              <a href={`mailto:${r.requesterEmail}`} className="admin-wrap">
                {r.requesterEmail}
              </a>
            ),
          },
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

/** A5 Privacy requests: LGPD queue with legal deadline (15 days). */
export function AdminPrivacyPage() {
  const T = useText(ADMIN_MESSAGES).privacy;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const state = useQueueState();
  const query = adminPrivacyQuery.useQuery();
  return (
    <AdminLayout section="privacy">
      <Notice tone="info">{T.rule(PRIVACY_RESPONSE_DAYS)}</Notice>
      <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
        {({ items }) => {
          const status = pickStatus(meta.privacyStatus, state.status);
          const closedLast = (r: PrivacyRequest) => Number(privacyDeadlineOf(r).state === 'closed');
          const sorted = [...items].sort((a, b) => closedLast(a) - closedLast(b) || a.dueAt.localeCompare(b.dueAt));
          return (
            <div className="stack">
              <StatusFilter
                label={adminText.common.statusFilter}
                options={statusOptions(meta.privacyStatus, items, statusOf)}
                value={status}
                total={items.length}
                onChange={state.setStatus}
              />
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
                        {r.protocol} · {meta.privacyRight[r.right]}
                      </b>
                      <StatusTag meta={meta.privacyStatus[r.status]} />
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
