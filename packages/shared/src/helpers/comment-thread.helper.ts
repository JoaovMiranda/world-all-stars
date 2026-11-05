import { COMMENT_MAX_LENGTH } from '../consts/text-limits.const';
import { CommentSort } from '../enums/comment-sort.enum';
import type { Comment, CommentsResponse, CommentThread } from '../schemas/comment.schema';

const score = (c: Comment) => c.likes - c.dislikes;

/**
 * Threads of one athlete from flat visible rows (doc 20): replies chronological under their top comment;
 * `top` = likes − dislikes then newest, `recent` = newest. Same order on the server and in the fixtures.
 */
export const buildCommentThreads = (rows: readonly Comment[], sort: CommentSort): CommentsResponse => {
  const threads: CommentThread[] = rows
    .filter((c) => !c.parentId)
    .map((top) => ({ ...top, replies: rows.filter((r) => r.parentId === top.id).sort((a, b) => a.at.localeCompare(b.at)) }))
    .sort((a, b) => (sort === CommentSort.Recent ? b.at.localeCompare(a.at) : score(b) - score(a) || b.at.localeCompare(a.at)));
  return { threads, total: rows.length, max: COMMENT_MAX_LENGTH, nextCursor: null };
};
