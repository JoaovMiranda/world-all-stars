import { COMMENTS_PAGE_SIZE } from '../consts/pagination.const';
import { COMMENT_MAX_LENGTH } from '../consts/text-limits.const';
import { CommentSort } from '../enums/comment-sort.enum';
import type { CommentPage } from '../interfaces/comment-page.interface';
import type { Comment, CommentsResponse, CommentThread } from '../types/comment.type';

const score = (c: Comment) => c.likes - c.dislikes;

/** Order of threads: `top` = likes − dislikes, then newest; `recent` = newest. Ties broken by id (stable pages). */
export const compareThreads = (sort: CommentSort) => (a: Comment, b: Comment) =>
  (sort === CommentSort.Recent ? 0 : score(b) - score(a)) || b.at.localeCompare(a.at) || b.id.localeCompare(a.id);

/**
 * Threads of one athlete from flat visible rows (doc 20): replies chronological under their top comment, threads in
 * `compareThreads` order, one page of `limit` threads after `cursor` (keyset on the thread id, as the server's SQL).
 * The server passes the rows of one page it already selected (`limit: Infinity`) and its own total/next cursor.
 */
export const buildCommentThreads = (rows: readonly Comment[], sort: CommentSort, page: CommentPage = {}): CommentsResponse => {
  const limit = page.limit ?? COMMENTS_PAGE_SIZE;
  const sorted = rows.filter((c) => !c.parentId).sort(compareThreads(sort));
  const start = page.cursor ? sorted.findIndex((t) => t.id === page.cursor) + 1 : 0;
  const tops = sorted.slice(start, start + limit);
  const threads: CommentThread[] = tops.map((top) => ({ ...top, replies: rows.filter((r) => r.parentId === top.id).sort((a, b) => a.at.localeCompare(b.at)) }));
  const hasMore = start + limit < sorted.length;
  return { threads, total: page.total ?? rows.length, max: COMMENT_MAX_LENGTH, nextCursor: hasMore ? (tops.at(-1)?.id ?? null) : null };
};
