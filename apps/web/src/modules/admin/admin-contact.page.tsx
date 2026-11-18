import { ADMIN_CONTACT_TAB_VALUES, type AdminContactMessage, AdminContactSearchSchema, AdminContactTab, type AdminSuggestion, ContactStatus, SuggestionStatus, checkSourceUrl } from '@was/shared';

import { adminInboxQuery, reviewSuggestion, updateContactMessage } from '@/data/endpoints/admin.query';
import { validationContextQuery } from '@/data/endpoints/discovery.query';
import { useLocale } from '@/i18n/locale.store';
import { useText } from '@/i18n/use-text.hook';
import { type DecisionAction, DecisionBar } from '@/shared-ui/decision-bar.component';
import { DOMAIN_LABELS_MESSAGES } from '@/shared-ui/domain-labels.const';
import { FactList } from '@/shared-ui/fact-list.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tabs } from '@/shared-ui/tabs.component';
import { Tag } from '@/shared-ui/tag.component';

import { ADMIN_MESSAGES } from './admin.const';
import { formatDateTime } from './admin-format.helper';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_REASON, filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import type { QueueState } from './queue-state.type';
import { StatusTag } from './status-tag.component';
import { useAdminTab } from './use-admin-tab.hook';
import { useQueueState } from './use-queue-state.hook';
import { useAdminMeta } from './use-admin-meta.hook';

function SuggestionDetail({ s }: { s: AdminSuggestion }) {
  const locale = useLocale();
  const T = useText(ADMIN_MESSAGES).contact;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const review = reviewSuggestion.useMutation();
  const ctx = validationContextQuery.useQuery();
  const set = (status: SuggestionStatus) => (note: string) => review.mutateAsync({ params: { id: s.id }, body: { status, note } });
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={meta.suggestionStatus[s.status]} />
      </div>
      <h2>{s.athleteName}</h2>
      <FactList
        variant="split"
        items={[
          { key: 'protocol', term: adminText.common.protocol, detail: s.protocol },
          { key: 'sport', term: adminText.common.sport, detail: s.sport ?? T.noValue },
          { key: 'email', term: adminText.common.email, detail: s.email ?? T.noValue },
          { key: 'at', term: adminText.common.created, detail: formatDateTime(s.createdAt) },
        ]}
      />
      <div>
        <h3 className="label">{T.links}</h3>
        <ul className="admin-list">
          {s.urls.map((u) => {
            const r = ctx.data ? checkSourceUrl(u, ctx.data.sources, locale) : null;
            return (
              <li key={u}>
                <a href={u} target="_blank" rel="noopener noreferrer">{u}</a>{' '}
                {r && (r.ok ? <Tag tone="success">{r.source?.name ?? T.linkOk}</Tag> : <Tag tone="danger">{r.message}</Tag>)}
                {r?.ok && r.note && <small className="muted block">{r.note}</small>}
              </li>
            );
          })}
        </ul>
      </div>
      <div>
        <h3 className="label">{T.why}</h3>
        <p className="admin-wrap">{s.why || T.noValue}</p>
      </div>
      {s.status === SuggestionStatus.Pending && (
        <DecisionBar
          label={T.decisionLabel}
          actions={[
            { key: 'approve', label: T.approve, variant: 'primary', confirmTitle: T.approveTitle, confirmBody: <p className="muted">{T.approveText}</p>, reason: ADMIN_REASON, onConfirm: set(SuggestionStatus.Approved) },
            { key: 'dup', label: T.duplicate, confirmTitle: T.duplicateTitle, reason: ADMIN_REASON, onConfirm: set(SuggestionStatus.Duplicate) },
            { key: 'reject', label: T.reject, variant: 'danger', confirmTitle: T.rejectTitle, reason: ADMIN_REASON, onConfirm: set(SuggestionStatus.Rejected) },
          ]}
        />
      )}
    </div>
  );
}

function MessageDetail({ m }: { m: AdminContactMessage }) {
  const T = useText(ADMIN_MESSAGES).contact;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const update = updateContactMessage.useMutation();
  const set = (status: ContactStatus) => () => update.mutateAsync({ params: { id: m.id }, body: { status } });
  const actions: DecisionAction[] =
    m.status === ContactStatus.Closed
      ? [{ key: 'reopen', label: T.reopen, confirmTitle: T.reopenTitle, onConfirm: set(ContactStatus.New) }]
      : [
          ...(m.status === ContactStatus.New ? [{ key: 'ans', label: T.markAnswered, variant: 'primary' as const, confirmTitle: T.markAnsweredTitle, onConfirm: set(ContactStatus.Answered) }] : []),
          { key: 'close', label: T.close, confirmTitle: T.closeTitle, onConfirm: set(ContactStatus.Closed) },
        ];
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={meta.contactStatus[m.status]} />
        <Tag tone="soft">{labels.contactTopic[m.topic]}</Tag>
      </div>
      <h2>{m.name}</h2>
      <FactList
        variant="split"
        items={[
          { key: 'protocol', term: adminText.common.protocol, detail: m.protocol },
          { key: 'email', term: adminText.common.email, detail: <a href={`mailto:${m.email}?subject=${encodeURIComponent(m.protocol)}`} className="admin-wrap">{m.email}</a> },
          { key: 'at', term: adminText.common.created, detail: formatDateTime(m.createdAt) },
        ]}
      />
      <blockquote className="admin-quote">{m.body}</blockquote>
      <DecisionBar label={T.messageLabel} actions={actions} />
    </div>
  );
}

function SuggestionsTab({ items, state }: { items: readonly AdminSuggestion[]; state: QueueState }) {
  const T = useText(ADMIN_MESSAGES).contact;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const statusOf = (s: AdminSuggestion) => s.status;
  const status = pickStatus(meta.suggestionStatus, state.status);
  return (
    <div className="stack">
      <StatusFilter label={adminText.common.statusFilter} options={statusOptions(meta.suggestionStatus, items, statusOf)} value={status} total={items.length} onChange={state.setStatus} />
      <ReviewQueue
        label={T.suggestionsLabel}
        items={filterByStatus(items, status, statusOf)}
        getKey={(s) => s.id}
        selectedKey={state.item}
        onSelect={state.setItem}
        emptyTitle={T.emptySuggestions}
        emptyText={T.emptyText}
        renderItem={(s) => (
          <>
            <span className="review-queue-item-head">
              <b>{s.athleteName}</b>
              <StatusTag meta={meta.suggestionStatus[s.status]} />
            </span>
            <small>
              {s.protocol} · {formatDateTime(s.createdAt)}
            </small>
          </>
        )}
        renderDetail={(s) => <SuggestionDetail key={s.id} s={s} />}
      />
    </div>
  );
}

function MessagesTab({ items, state }: { items: readonly AdminContactMessage[]; state: QueueState }) {
  const T = useText(ADMIN_MESSAGES).contact;
  const adminText = useText(ADMIN_MESSAGES);
  const meta = useAdminMeta();
  const labels = useText(DOMAIN_LABELS_MESSAGES);
  const statusOf = (m: AdminContactMessage) => m.status;
  const status = pickStatus(meta.contactStatus, state.status);
  return (
    <div className="stack">
      <StatusFilter label={adminText.common.statusFilter} options={statusOptions(meta.contactStatus, items, statusOf)} value={status} total={items.length} onChange={state.setStatus} />
      <ReviewQueue
        label={T.messagesLabel}
        items={filterByStatus(items, status, statusOf)}
        getKey={(m) => m.id}
        selectedKey={state.item}
        onSelect={state.setItem}
        emptyTitle={T.emptyMessages}
        emptyText={T.emptyText}
        renderItem={(m) => (
          <>
            <span className="review-queue-item-head">
              <b>{m.name}</b>
              <StatusTag meta={meta.contactStatus[m.status]} />
            </span>
            <small>
              {labels.contactTopic[m.topic]} · {formatDateTime(m.createdAt)}
            </small>
          </>
        )}
        renderDetail={(m) => <MessageDetail key={m.id} m={m} />}
      />
    </div>
  );
}

/** A8 Sugestões e contato: athlete suggestions (approve → collection links, duplicate, reject) and the message inbox. */
export function AdminContactPage() {
  const T = useText(ADMIN_MESSAGES).contact;
  const { tab, setTab } = useAdminTab(AdminContactSearchSchema, ADMIN_CONTACT_TAB_VALUES);
  const state = useQueueState();
  const query = adminInboxQuery.useQuery();
  return (
    <AdminLayout section="contact">
      <Tabs
        label={T.tabsLabel}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: AdminContactTab.Suggestions, label: T.tabs.suggestions, ...(query.data ? { count: query.data.suggestions.filter((s) => s.status === SuggestionStatus.Pending).length } : {}) },
          { value: AdminContactTab.Messages, label: T.tabs.messages, ...(query.data ? { count: query.data.messages.filter((m) => m.status === ContactStatus.New).length } : {}) },
        ]}
      >
        <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
          {(data) => (tab === AdminContactTab.Suggestions ? <SuggestionsTab items={data.suggestions} state={state} /> : <MessagesTab items={data.messages} state={state} />)}
        </QueryBoundary>
      </Tabs>
    </AdminLayout>
  );
}
