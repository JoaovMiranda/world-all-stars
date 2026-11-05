import { ADMIN_COMMENTS_TAB_VALUES, AthleteProfileTab, COMMENT_FLAG_MIN_DISLIKES, type AdminComment, AdminCommentsSearchSchema, AdminCommentsTab, CommentStatus, isCommentFlagged } from '@was/shared';
import { Link } from '@tanstack/react-router';

import { adminCommentsQuery, moderateComment } from '@/data/endpoints/admin.query';
import { DecisionBar } from '@/shared-ui/decision-bar.component';
import { FactList } from '@/shared-ui/fact-list.component';
import { Notice } from '@/shared-ui/notice.component';
import { QueryBoundary } from '@/shared-ui/query-boundary.component';
import { ReviewQueue } from '@/shared-ui/review-queue.component';
import { SkeletonList } from '@/shared-ui/skeleton.component';
import { StatusFilter } from '@/shared-ui/status-filter.component';
import { Tabs } from '@/shared-ui/tabs.component';

import { ADMIN_TEXT } from './admin.const';
import { formatDateTime } from './admin-format.helper';
import { COMMENT_STATUS_META, type StatusMeta } from './admin-labels.const';
import { AdminLayout } from './admin-layout.component';
import { ADMIN_REASON, filterByStatus, pickStatus, statusOptions } from './admin-queue.helper';
import { BannedWords } from './banned-words.component';
import { StatusTag } from './status-tag.component';
import { useAdminTab } from './use-admin-tab.hook';
import { useQueueState } from './use-queue-state.hook';

const T = ADMIN_TEXT.comments;
type CommentFilter = 'flagged' | CommentStatus;
const FILTER_META: Record<CommentFilter, StatusMeta> = { flagged: { label: T.flagged, tone: 'gold' }, ...COMMENT_STATUS_META };
const filterOf = (c: AdminComment): CommentFilter => (isCommentFlagged(c) ? 'flagged' : c.status);

function CommentDetail({ c }: { c: AdminComment }) {
  const moderate = moderateComment.useMutation();
  const set = (status: CommentStatus) => (reason: string) => moderate.mutateAsync({ params: { id: c.id }, body: { status, reason } });
  const hidden = c.status === CommentStatus.Hidden;
  return (
    <div className="admin-detail">
      <div className="admin-detail-head">
        <StatusTag meta={FILTER_META[filterOf(c)]} />
      </div>
      <h2>
        {c.author} <small className="muted">{T.on}</small>{' '}
        <Link to="/athletes/$slug" params={{ slug: c.athlete.slug }} search={{ tab: AthleteProfileTab.Comments }}>
          {c.athlete.knownAs}
        </Link>
      </h2>
      <blockquote className="admin-quote">{c.body}</blockquote>
      <FactList
        variant="split"
        items={[
          { key: 'at', term: ADMIN_TEXT.common.created, detail: formatDateTime(c.at) },
          { key: 'likes', term: T.likes, detail: c.likes },
          { key: 'dislikes', term: T.dislikes, detail: c.dislikes },
          { key: 'replies', term: T.replies, detail: c.replies },
        ]}
      />
      {c.hiddenReason && (
        <Notice>
          <b>{T.hiddenReason}:</b> {c.hiddenReason}
        </Notice>
      )}
      <DecisionBar
        label={T.decisionLabel}
        actions={[
          hidden
            ? { key: 'show', label: T.show, confirmTitle: T.showTitle, reason: ADMIN_REASON, onConfirm: set(CommentStatus.Visible) }
            : { key: 'hide', label: T.hide, variant: 'danger', confirmTitle: T.hideTitle, confirmBody: <p className="muted">{T.hideText}</p>, reason: ADMIN_REASON, onConfirm: set(CommentStatus.Hidden) },
        ]}
      />
    </div>
  );
}

/** A7 Moderação: comments with many dislikes (hide/show with reason) and the banned-words list per locale. */
export function AdminCommentsPage() {
  const { tab, setTab } = useAdminTab(AdminCommentsSearchSchema, ADMIN_COMMENTS_TAB_VALUES);
  const state = useQueueState();
  const query = adminCommentsQuery.useQuery();
  return (
    <AdminLayout section="comments">
      <Tabs
        label={T.tabsLabel}
        value={tab}
        onChange={setTab}
        tabs={[
          { value: AdminCommentsTab.Queue, label: T.tabs.queue, ...(query.data ? { count: query.data.items.filter(isCommentFlagged).length } : {}) },
          { value: AdminCommentsTab.Words, label: T.tabs.words, ...(query.data ? { count: query.data.bannedWords.length } : {}) },
        ]}
      >
        <QueryBoundary query={query} loading={<SkeletonList rows={6} />}>
          {({ items, bannedWords }) => {
            if (tab === AdminCommentsTab.Words) return <BannedWords words={bannedWords} state={state} />;
            const status = pickStatus(FILTER_META, state.status);
            return (
              <div className="stack">
                <Notice tone="info">{T.flagRule(COMMENT_FLAG_MIN_DISLIKES)}</Notice>
                <StatusFilter label={ADMIN_TEXT.common.statusFilter} options={statusOptions(FILTER_META, items, filterOf)} value={status} total={items.length} onChange={state.setStatus} />
                <ReviewQueue
                  label={T.queueLabel}
                  items={filterByStatus(items, status, filterOf)}
                  getKey={(c) => c.id}
                  selectedKey={state.item}
                  onSelect={state.setItem}
                  emptyTitle={T.empty}
                  renderItem={(c) => (
                    <>
                      <span className="review-queue-item-head">
                        <b>
                          {c.author} · {c.athlete.knownAs}
                        </b>
                        <StatusTag meta={FILTER_META[filterOf(c)]} />
                      </span>
                      <small>
                        {T.dislikes}: {c.dislikes} · {T.likes}: {c.likes}
                      </small>
                    </>
                  )}
                  renderDetail={(c) => <CommentDetail key={c.id} c={c} />}
                />
              </div>
            );
          }}
        </QueryBoundary>
      </Tabs>
    </AdminLayout>
  );
}
