import { commentReactions, commentReports, comments, notifications, users } from '@was/db';
import {
  ApiErrorCode,
  buildCommentThreads,
  COMMENT_EDIT_WINDOW_MS,
  COMMENTS_PAGE_SIZE,
  type Comment,
  type CommentReaction,
  type CommentSort,
  CommentStatus,
  type CommentsResponse,
  NotificationKind,
  type ReactToCommentResponse,
  validateComment,
} from '@was/shared';

import type { AuthUser } from '../../auth/auth-provider.type';
import { BaseService } from '../../core/base.service';
import { forbidden, notFound, unprocessable, unprocessableKey } from '../../http/http-error.helper';
import { ModerationRepository } from '../moderation/moderation.repository';
import { CommentsRepository } from './comments.repository';

const NOTIFICATION_EXCERPT = 140;
const counterOf = (r: CommentReaction) => (r === 'like' ? 'likesCount' : 'dislikesCount');
/** End of the author's edit window (T3.3), in epoch ms. */
const editableUntil = (createdAt: Date) => createdAt.getTime() + COMMENT_EDIT_WINDOW_MS;

/** Comments of a profile (doc 20): threads, replies, reactions and the author's own deletion. */
export class CommentsService extends BaseService {
  private get comments() {
    return new CommentsRepository(this.db);
  }

  private async athleteIdOf(slug: string) {
    const a = (await this.ctx.deps.catalog.get(this.ctx.locale)).athleteBySlug(slug);
    if (!a) throw notFound();
    return a.id;
  }

  /**
   * GET threads (doc 20): one page of top-level comments (keyset in SQL, COMMENTS_PAGE_SIZE) + their replies + the
   * total, then threading and order by the shared buildCommentThreads.
   */
  async listComments(slug: string, sort: CommentSort, cursor?: string): Promise<CommentsResponse> {
    const athleteId = await this.athleteIdOf(slug);
    const read = this.comments;
    // An unknown/deleted cursor restarts at the first page instead of returning nothing.
    const from = cursor && (await read.findComment(cursor))?.athleteId === athleteId ? cursor : null;
    const [page, total] = await Promise.all([read.topCommentsPage(athleteId, sort, from, COMMENTS_PAGE_SIZE), read.countVisibleComments(athleteId)]);
    const tops = page.slice(0, COMMENTS_PAGE_SIZE);
    const replies = await read.repliesOf(
      athleteId,
      tops.map((r) => r.c.id),
    );
    const rows = [...tops, ...replies];
    const me = this.ctx.session.user;
    const mine = me
      ? new Map(
          (
            await read.reactionsOf(
              me.id,
              rows.map((r) => r.c.id),
            )
          ).map((r) => [r.commentId, r.reaction]),
        )
      : new Map();
    const now = Date.now();
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
      ...(c.editedAt ? { editedAt: c.editedAt.toISOString() } : {}),
      ...(me && c.userId === me.id && editableUntil(c.createdAt) > now ? { editableUntil: new Date(editableUntil(c.createdAt)).toISOString() } : {}),
    }));
    const built = buildCommentThreads(flat, sort, { limit: Number.POSITIVE_INFINITY, total });
    return { ...built, nextCursor: page.length > COMMENTS_PAGE_SIZE ? (tops.at(-1)?.c.id ?? null) : null };
  }

  /** POST comment/reply: shared validateComment (422), reply to a reply goes to the top comment, notifies the parent author. */
  async postComment(user: AuthUser, slug: string, body: string, parentId: string | null | undefined) {
    const read = this.comments;
    // Daily cap per account on top of the per-minute route limit (RATE_LIMITS.commentDaily, doc 20).
    await this.ctx.deps.rateLimiter.hit('commentDaily', user.id);
    // Independent reads in one round-trip: the athlete (404 when unknown), the banned words and the parent comment.
    const [athleteId, words, found] = await Promise.all([
      this.athleteIdOf(slug),
      new ModerationRepository(this.db).loadBannedWords(),
      parentId ? read.findComment(parentId) : null,
    ]);
    const result = validateComment(body, words, this.ctx.locale);
    if (!result.ok) throw unprocessable(result.error, result.message, { body: result.message });
    let parent = found;
    if (parentId && (!parent || parent.athleteId !== athleteId || parent.status !== CommentStatus.Visible)) {
      throw unprocessableKey(ApiErrorCode.Parent, 'parentGone');
    }
    if (parent?.parentCommentId) parent = await read.findComment(parent.parentCommentId);
    return this.transaction(async (repo) => {
      const row = await repo.insert(comments, { athleteId, userId: user.id, parentCommentId: parent?.id ?? null, body: result.text }, this.actor);
      await repo.increment(users, user.id, { commentsCount: 1 });
      if (parent) {
        await repo.increment(comments, parent.id, { repliesCount: 1 });
        if (parent.userId !== user.id) {
          await repo.insert(
            notifications,
            {
              userId: parent.userId,
              kind: NotificationKind.CommentReply,
              entityType: 'comments',
              entityId: row.id,
              actorId: user.id,
              payload: { excerpt: result.text.slice(0, NOTIFICATION_EXCERPT), athleteId, commentId: row.id },
            },
            this.actor,
          );
        }
      }
      return { id: row.id };
    });
  }

  /** PUT reaction: one per user per comment (switch/undo), never on your own comment (403). */
  async reactToComment(user: AuthUser, id: string, reaction: CommentReaction | null): Promise<ReactToCommentResponse> {
    const target = await this.comments.findComment(id);
    if (!target || target.status !== CommentStatus.Visible) throw notFound();
    if (target.userId === user.id) throw forbidden(ApiErrorCode.Own, 'ownComment');
    return this.transaction(async (repo) => {
      const read = new CommentsRepository(repo.db);
      const existing = await read.findReaction(id, user.id);
      if (existing && existing.reaction !== reaction) {
        await repo.increment(comments, id, { [counterOf(existing.reaction)]: -1 });
        if (reaction) await repo.update(commentReactions, existing.id, { reaction }, this.actor, { summary: `reaction → ${reaction}` });
        else await repo.softDelete(commentReactions, existing.id, this.actor, { summary: 'reaction undone' });
        if (reaction) await repo.increment(comments, id, { [counterOf(reaction)]: 1 });
      } else if (!existing && reaction) {
        await repo.insert(commentReactions, { commentId: id, userId: user.id, reaction }, this.actor);
        await repo.increment(comments, id, { [counterOf(reaction)]: 1 });
      }
      const after = (await read.findComment(id))!;
      return { reaction, likes: after.likesCount, dislikes: after.dislikesCount };
    });
  }

  /**
   * PATCH my comment (T3.3): author only (403), within COMMENT_EDIT_WINDOW_MS of posting (422 edit_window_closed), same
   * validation as posting (length + banned words of every locale); versioned like any write, `edited_at` shown to readers.
   */
  async editComment(user: AuthUser, id: string, body: string) {
    const [target, words] = await Promise.all([this.comments.findComment(id), new ModerationRepository(this.db).loadBannedWords()]);
    if (!target || target.status !== CommentStatus.Visible) throw notFound();
    if (target.userId !== user.id) throw forbidden();
    if (Date.now() > editableUntil(target.createdAt)) throw unprocessableKey(ApiErrorCode.EditWindowClosed, 'editWindowClosed');
    const result = validateComment(body, words, this.ctx.locale);
    if (!result.ok) throw unprocessable(result.error, result.message, { body: result.message });
    const editedAt = new Date();
    if (result.text !== target.body) await this.repo.update(comments, id, { body: result.text, editedAt }, this.actor, { summary: 'edited by the author' });
    return { id, editedAt: (result.text !== target.body ? editedAt : (target.editedAt ?? editedAt)).toISOString() };
  }

  /**
   * POST report (T3.3): one report per reader per comment (idempotent: reporting again changes nothing), never your own
   * comment (403). Any report puts a visible comment in the admin moderation queue (isCommentFlagged).
   */
  async reportComment(user: AuthUser, id: string, reason: string | undefined) {
    const target = await this.comments.findComment(id);
    if (!target || target.status !== CommentStatus.Visible) throw notFound();
    if (target.userId === user.id) throw forbidden();
    await this.transaction(async (repo) => {
      const read = new CommentsRepository(repo.db);
      // Row lock on the comment: parallel reports of the same reader cannot both pass the "not reported yet" check.
      await read.lockComment(id);
      if (await read.findReport(id, user.id)) return;
      await repo.insert(commentReports, { commentId: id, userId: user.id, reason: reason || null }, this.actor, { summary: 'reported' });
      await repo.increment(comments, id, { reportsCount: 1 });
    });
    return { reported: true as const };
  }

  /** DELETE my comment (soft delete by the author). */
  async deleteComment(user: AuthUser, id: string) {
    const target = await this.comments.findComment(id);
    if (!target) throw notFound();
    if (target.userId !== user.id) throw forbidden();
    await this.transaction(async (repo) => {
      await repo.softDelete(comments, id, this.actor, { summary: 'deleted by the author' });
      if (target.parentCommentId) await repo.increment(comments, target.parentCommentId, { repliesCount: -1 });
    });
    return { ok: true as const };
  }
}
