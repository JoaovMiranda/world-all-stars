import { commentReactions, comments, notifications, users } from '@was/db';
import {
  ApiErrorCode,
  type Comment,
  type CommentReaction,
  CommentStatus,
  type CommentSort,
  type CommentsResponse,
  NotificationKind,
  type ReactToCommentResponse,
  buildCommentThreads,
  COMMENTS_PAGE_SIZE,
  validateComment,
} from '@was/shared';

import type { AuthUser } from '../../auth/auth-provider.type';
import type { RequestContext } from '../../http/app-context.type';
import { forbidden, notFound, unprocessable, unprocessableKey } from '../../http/http-error.error';
import { loadBannedWords } from '../moderation/moderation.repository';
import { countVisibleComments, findComment, findReaction, reactionsOf, repliesOf, topCommentsPage } from './comments.repository';

const NOTIFICATION_EXCERPT = 140;
const athleteIdOf = async (ctx: RequestContext, slug: string) => {
  const a = (await ctx.deps.catalog.get(ctx.locale)).athleteBySlug(slug);
  if (!a) throw notFound();
  return a.id;
};
const counterOf = (r: CommentReaction) => (r === 'like' ? 'likesCount' : 'dislikesCount');

/**
 * GET threads (doc 20): one page of top-level comments (keyset in SQL, COMMENTS_PAGE_SIZE) + their replies + the
 * total, then threading and order by the shared buildCommentThreads.
 */
export const listComments = async (ctx: RequestContext, slug: string, sort: CommentSort, cursor?: string): Promise<CommentsResponse> => {
  const athleteId = await athleteIdOf(ctx, slug);
  const db = ctx.deps.db;
  // An unknown/deleted cursor restarts at the first page instead of returning nothing.
  const from = cursor && (await findComment(db, cursor))?.athleteId === athleteId ? cursor : null;
  const [page, total] = await Promise.all([topCommentsPage(db, athleteId, sort, from, COMMENTS_PAGE_SIZE), countVisibleComments(db, athleteId)]);
  const tops = page.slice(0, COMMENTS_PAGE_SIZE);
  const replies = await repliesOf(db, athleteId, tops.map((r) => r.c.id));
  const rows = [...tops, ...replies];
  const me = ctx.session.user;
  const mine = me ? new Map((await reactionsOf(db, me.id, rows.map((r) => r.c.id))).map((r) => [r.commentId, r.reaction])) : new Map();
  const flat: Comment[] = rows.map(({ c, author }) => ({
    id: c.id,
    parentId: c.parentCommentId,
    body: c.body,
    author,
    isMine: !!me && c.userId === me.id,
    at: c.createdAt.toISOString(),
    likes: c.likesCount,
    dislikes: c.dislikesCount,
    myReaction: mine.get(c.id) ?? null,
  }));
  const built = buildCommentThreads(flat, sort, { limit: Number.POSITIVE_INFINITY, total });
  return { ...built, nextCursor: page.length > COMMENTS_PAGE_SIZE ? (tops.at(-1)?.c.id ?? null) : null };
};

/** POST comment/reply: shared validateComment (422), reply to a reply goes to the top comment, notifies the parent author. */
export const postComment = async (ctx: RequestContext, user: AuthUser, slug: string, body: string, parentId: string | null | undefined) => {
  // Independent reads in one round-trip: the athlete (404 when unknown), the banned words and the parent comment.
  const [athleteId, words, found] = await Promise.all([athleteIdOf(ctx, slug), loadBannedWords(ctx.deps.db), parentId ? findComment(ctx.deps.db, parentId) : null]);
  const result = validateComment(body, words, ctx.locale);
  if (!result.ok) throw unprocessable(result.error, result.message, { body: result.message });
  let parent = found;
  if (parentId && (!parent || parent.athleteId !== athleteId || parent.status !== CommentStatus.Visible)) {
    throw unprocessableKey(ApiErrorCode.Parent, 'parentGone');
  }
  if (parent?.parentCommentId) parent = await findComment(ctx.deps.db, parent.parentCommentId);
  return ctx.deps.repo.transaction(async (repo) => {
    const row = await repo.insert(comments, { athleteId, userId: user.id, parentCommentId: parent?.id ?? null, body: result.text }, ctx.actor);
    await repo.increment(users, user.id, { commentsCount: 1 });
    if (parent) {
      await repo.increment(comments, parent.id, { repliesCount: 1 });
      if (parent.userId !== user.id) {
        await repo.insert(
          notifications,
          { userId: parent.userId, kind: NotificationKind.CommentReply, entityType: 'comments', entityId: row.id, actorId: user.id, payload: { excerpt: result.text.slice(0, NOTIFICATION_EXCERPT), athleteId, commentId: row.id } },
          ctx.actor,
        );
      }
    }
    return { id: row.id };
  });
};

/** PUT reaction: one per user per comment (switch/undo), never on your own comment (403). */
export const reactToComment = async (ctx: RequestContext, user: AuthUser, id: string, reaction: CommentReaction | null): Promise<ReactToCommentResponse> => {
  const target = await findComment(ctx.deps.db, id);
  if (!target || target.status !== CommentStatus.Visible) throw notFound();
  if (target.userId === user.id) throw forbidden(ApiErrorCode.Own, 'ownComment');
  return ctx.deps.repo.transaction(async (repo) => {
    const existing = await findReaction(repo.db, id, user.id);
    if (existing && existing.reaction !== reaction) {
      await repo.increment(comments, id, { [counterOf(existing.reaction)]: -1 });
      if (reaction) await repo.update(commentReactions, existing.id, { reaction }, ctx.actor, { summary: `reaction → ${reaction}` });
      else await repo.softDelete(commentReactions, existing.id, ctx.actor, { summary: 'reaction undone' });
      if (reaction) await repo.increment(comments, id, { [counterOf(reaction)]: 1 });
    } else if (!existing && reaction) {
      await repo.insert(commentReactions, { commentId: id, userId: user.id, reaction }, ctx.actor);
      await repo.increment(comments, id, { [counterOf(reaction)]: 1 });
    }
    const after = (await findComment(repo.db, id))!;
    return { reaction, likes: after.likesCount, dislikes: after.dislikesCount };
  });
};

/** DELETE my comment (soft delete by the author). */
export const deleteComment = async (ctx: RequestContext, user: AuthUser, id: string) => {
  const target = await findComment(ctx.deps.db, id);
  if (!target) throw notFound();
  if (target.userId !== user.id) throw forbidden();
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.softDelete(comments, id, ctx.actor, { summary: 'deleted by the author' });
    if (target.parentCommentId) await repo.increment(comments, target.parentCommentId, { repliesCount: -1 });
  });
  return { ok: true as const };
};
