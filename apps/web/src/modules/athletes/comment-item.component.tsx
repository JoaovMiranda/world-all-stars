import { type Comment, CommentReaction } from '@was/shared';
import { type MouseEvent, useState } from 'react';

import { reactToComment } from '@/data/endpoints/comments.query';
import { useText } from '@/i18n/use-text.hook';
import { useSession } from '@/session/use-session.hook';
import { Button } from '@/shared-ui/button.component';
import { formatRelativeDay } from '@/shared-ui/relative-time.helper';
import { Tag } from '@/shared-ui/tag.component';

import { ATHLETE_PROFILE_MESSAGES } from './athletes.const';
import { CommentEditForm } from './comment-edit-form.component';
import { COMMENT_MODERATION_MESSAGES } from './comment-moderation.const';
import { applyReaction } from './comment-reaction.helper';
import { CommentReportButton } from './comment-report-button.component';
import { hop, squash } from './vote-motion.helper';

interface CommentItemProps {
  comment: Comment;
  /** Shows "Responder" (top-level comments only: replies are 1 level deep). */
  onReply?: () => void;
}

/** One comment: author, relative date, body (escaped, pre-wrap), like/dislike toggle (not on your own) and reply. */
export function CommentItem({ comment, onReply }: CommentItemProps) {
  const T = useText(ATHLETE_PROFILE_MESSAGES).comments;
  const M = useText(COMMENT_MODERATION_MESSAGES);
  const { requireLogin } = useSession();
  const [editing, setEditing] = useState(false);
  const react = reactToComment.useMutation();
  // Optimistic (Doherty): counts and pressed state change on click; the refetch confirms them.
  const c = react.isPending && react.variables ? applyReaction(comment, react.variables.body.reaction) : comment;
  const toggle = (r: CommentReaction, event: MouseEvent<HTMLButtonElement>) => {
    if (!requireLogin('react') || react.isPending) return;
    const next = c.myReaction === r ? null : r;
    squash(event.currentTarget);
    // Anticipation only when turning a reaction on: ▲ dips then jumps, ▼ rises then drops.
    if (next) hop(event.currentTarget.firstElementChild, r === CommentReaction.Like ? 'up' : 'down');
    react.mutate({ params: { id: c.id }, body: { reaction: next } });
  };
  const own = c.isMine ? { disabled: true, title: T.ownComment } : {};
  return (
    <article className="comment" aria-label={c.author}>
      <header className="comment-head">
        <b>{c.author}</b>
        {c.isMine && <Tag tone="soft">{T.you}</Tag>}
        <time dateTime={c.at}>{formatRelativeDay(c.at)}</time>
        {c.editedAt && <Tag tone="soft">{M.edited}</Tag>}
      </header>
      {editing ? <CommentEditForm id={c.id} body={c.body} onDone={() => setEditing(false)} /> : <p className="comment-body">{c.body}</p>}
      <footer className="comment-actions">
        <button
          type="button"
          className="react"
          aria-pressed={c.myReaction === CommentReaction.Like}
          aria-label={T.like(c.likes)}
          onClick={(e) => toggle(CommentReaction.Like, e)}
          {...own}
        >
          <span aria-hidden="true">▲</span> <span className="num">{c.likes}</span>
        </button>
        <button
          type="button"
          className="react"
          aria-pressed={c.myReaction === CommentReaction.Dislike}
          aria-label={T.dislike(c.dislikes)}
          onClick={(e) => toggle(CommentReaction.Dislike, e)}
          {...own}
        >
          <span aria-hidden="true">▼</span> <span className="num">{c.dislikes}</span>
        </button>
        {onReply && (
          <Button variant="link" onClick={onReply}>
            {T.reply}
          </Button>
        )}
        {/* The server only sends editableUntil on my comments still inside the 10-minute window (T3.3). */}
        {c.isMine && c.editableUntil && !editing && (
          <Button variant="link" aria-label={M.editLabel} onClick={() => setEditing(true)}>
            {M.edit}
          </Button>
        )}
        {!c.isMine && <CommentReportButton id={c.id} author={c.author} />}
      </footer>
    </article>
  );
}
