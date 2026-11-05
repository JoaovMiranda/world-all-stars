import { type Comment, CommentReaction } from '@was/shared';

import { reactToComment } from '@/data/endpoints/comments.query';
import { Button } from '@/shared-ui/button.component';
import { formatRelativeDay } from '@/shared-ui/relative-time.helper';
import { Tag } from '@/shared-ui/tag.component';
import { useSession } from '@/session/use-session.hook';

import { ATHLETE_PROFILE_TEXT } from './athletes.const';

const T = ATHLETE_PROFILE_TEXT.comments;

interface CommentItemProps {
  comment: Comment;
  /** Shows "Responder" (top-level comments only: replies are 1 level deep). */
  onReply?: () => void;
}

/** One comment: author, relative date, body (escaped, pre-wrap), like/dislike toggle (not on your own) and reply. */
export function CommentItem({ comment: c, onReply }: CommentItemProps) {
  const { requireLogin } = useSession();
  const react = reactToComment.useMutation();
  const toggle = (r: CommentReaction) => {
    if (!requireLogin('react')) return;
    react.mutate({ params: { id: c.id }, body: { reaction: c.myReaction === r ? null : r } });
  };
  const own = c.isMine ? { disabled: true, title: T.ownComment } : {};
  return (
    <article className="comment" aria-label={c.author}>
      <header className="comment-head">
        <b>{c.author}</b>
        {c.isMine && <Tag tone="soft">{T.you}</Tag>}
        <time dateTime={c.at}>{formatRelativeDay(c.at)}</time>
      </header>
      <p className="comment-body">{c.body}</p>
      <footer className="comment-actions">
        <button type="button" className="react" aria-pressed={c.myReaction === CommentReaction.Like} aria-label={T.like(c.likes)} onClick={() => toggle(CommentReaction.Like)} {...own}>
          <span aria-hidden="true">▲</span> <span className="num">{c.likes}</span>
        </button>
        <button type="button" className="react" aria-pressed={c.myReaction === CommentReaction.Dislike} aria-label={T.dislike(c.dislikes)} onClick={() => toggle(CommentReaction.Dislike)} {...own}>
          <span aria-hidden="true">▼</span> <span className="num">{c.dislikes}</span>
        </button>
        {onReply && (
          <Button variant="link" onClick={onReply}>
            {T.reply}
          </Button>
        )}
      </footer>
    </article>
  );
}
