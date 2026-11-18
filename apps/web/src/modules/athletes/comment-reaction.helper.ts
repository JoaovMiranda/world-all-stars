import { type Comment, CommentReaction } from '@was/shared';

type Counts = Pick<Comment, 'likes' | 'dislikes' | 'myReaction'>;

const field = (r: CommentReaction) => (r === CommentReaction.Like ? 'likes' : 'dislikes');

/** Counts as they will be after switching my reaction to `next` (null = remove): used for the optimistic view. */
export function applyReaction<C extends Counts>(comment: C, next: CommentReaction | null): C {
  if (comment.myReaction === next) return comment;
  const out = { ...comment, myReaction: next };
  if (comment.myReaction) out[field(comment.myReaction)] = Math.max(0, out[field(comment.myReaction)] - 1);
  if (next) out[field(next)] += 1;
  return out;
}
