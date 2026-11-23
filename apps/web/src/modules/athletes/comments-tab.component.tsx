import { useMutationState, useQueries } from '@tanstack/react-query';
import { type AthleteProfile, COMMENT_SORT_VALUES, type CommentSort, type CommentsResponse } from '@was/shared';
import { useEffect, useRef, useState } from 'react';

import { commentsQuery, postComment } from '@/data/endpoints/comments.query';

import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';
import { Button } from '@/shared-ui/button.component';
import { ChipToggleGroup } from '@/shared-ui/chip-toggle-group.component';
import { EmptyState } from '@/shared-ui/empty-state.component';
import { Section } from '@/shared-ui/section.component';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { CommentForm } from './comment-form.component';
import { CommentItem } from './comment-item.component';
import { PENDING_COMMENT_PREFIX } from './optimistic.const';
import { withPendingComments } from './optimistic.helper';

interface CommentsTabProps {
  profile: AthleteProfile;
  comments: CommentsResponse;
  sort: CommentSort;
  onSort: (sort: CommentSort) => void;
}

/** Comentários (doc 20): threads with 1 level of replies, sort top/recent, reactions; visitors are invited to sign in. */
export function CommentsTab({ profile, comments, sort, onSort }: CommentsTabProps) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).comments;
  const { user, isSignedIn, requireLogin } = useSession();
  const [replyTo, setReplyTo] = useState<string | null>(null);
  // "Ver mais": the first page comes from the page loader (SSR); each click adds the page after the last cursor.
  // Pages are kept per sort, so switching the order starts again from its first page.
  const [more, setMore] = useState<{ sort: CommentSort; cursors: string[] }>({ sort, cursors: [] });
  const cursors = more.sort === sort ? more.cursors : [];
  const pages = useQueries({
    queries: cursors.map((cursor) => commentsQuery.queryOptions({ params: { slug: profile.slug }, query: { sort, cursor } })),
  });
  // My comments still in flight are shown right away (Doherty); the refetched page replaces them.
  const pending = useMutationState({
    filters: { mutationKey: postComment.mutationKey, status: 'pending' },
    select: (m) => m.state.variables as { params: { slug: string }; body: { body: string; parentId?: string | null } } | undefined,
  }).flatMap((v) => (v && v.params.slug === profile.slug ? [v.body] : []));
  const loaded = [...comments.threads, ...pages.flatMap((p) => p.data?.threads ?? [])];
  const threads = withPendingComments(loaded, pending, user?.name ?? '', new Date().toISOString());
  const isPending = (id: string) => id.startsWith(PENDING_COMMENT_PREFIX);
  const last = pages.at(-1);
  const nextCursor = cursors.length ? (last?.data?.nextCursor ?? null) : comments.nextCursor;
  const loadingMore = !!last && last.isPending;
  // After "Ver mais", focus goes to the first new thread and the count is announced (WCAG 2.4.3 / 4.1.3): the
  // button may disappear on the last page, which would otherwise drop focus to <body>.
  const listRef = useRef<HTMLDivElement>(null);
  const firstNew = useRef<number | null>(null);
  const [announce, setAnnounce] = useState('');
  const loadMore = () => {
    if (!nextCursor || loadingMore) return;
    firstNew.current = loaded.length;
    setMore({ sort, cursors: [...cursors, nextCursor] });
  };
  useEffect(() => {
    const from = firstNew.current;
    if (from === null || loadingMore || loaded.length <= from) return;
    firstNew.current = null;
    setAnnounce(T.loadedMore(loaded.length - from));
    // My comments still in flight are listed first: skip them to reach the first loaded thread of the new page.
    const target = listRef.current?.querySelectorAll<HTMLElement>(':scope > .thread')[from + threads.length - loaded.length];
    if (target) {
      target.tabIndex = -1;
      target.focus();
    }
  }, [loaded.length, loadingMore, threads.length, T]);
  const reply = (id: string) => {
    if (requireLogin('reply')) setReplyTo(id);
  };
  return (
    <Section
      title={T.title(profile.knownAs)}
      actions={
        <ChipToggleGroup
          label={T.sortLabel}
          required
          value={sort}
          onChange={(v) => v && onSort(v)}
          options={COMMENT_SORT_VALUES.map((v) => ({ value: v, label: T.sort[v] }))}
        />
      }
    >
      {isSignedIn && user ? (
        <CommentForm slug={profile.slug} label={T.formLabel(user.name)} />
      ) : (
        <div className="comment-login">
          <span className="muted">{T.loginText}</span>
          <Button variant="secondary" onClick={() => requireLogin('comment')}>
            {T.loginAction}
          </Button>
        </div>
      )}
      <p className="comment-rules">{T.rules(comments.max)}</p>
      <p className="sr-only" aria-live="polite">
        {announce}
      </p>
      {threads.length ? (
        <div ref={listRef}>
          {threads.map((t) => (
            <div key={t.id} className={isPending(t.id) ? 'thread is-pending' : 'thread'} aria-busy={isPending(t.id) || undefined}>
              <CommentItem comment={t} {...(isPending(t.id) ? {} : { onReply: () => reply(t.id) })} />
              {(t.replies.length > 0 || replyTo === t.id) && (
                <div className="replies" role="group" aria-label={T.repliesLabel(t.author)}>
                  {t.replies.map((r) => (
                    <div key={r.id} className={isPending(r.id) ? 'is-pending' : undefined} aria-busy={isPending(r.id) || undefined}>
                      <CommentItem comment={r} />
                    </div>
                  ))}
                  {replyTo === t.id && isSignedIn && (
                    <CommentForm slug={profile.slug} parentId={t.id} label={T.replyLabel} autoFocus onDone={() => setReplyTo(null)} />
                  )}
                </div>
              )}
            </div>
          ))}
          {(nextCursor || loadingMore) && (
            <div className="comment-more">
              <Button variant="secondary" onClick={loadMore} pending={loadingMore}>
                {loadingMore ? T.loadingMore : T.loadMore}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <EmptyState compact title={T.empty} mark="◇" />
      )}
    </Section>
  );
}
