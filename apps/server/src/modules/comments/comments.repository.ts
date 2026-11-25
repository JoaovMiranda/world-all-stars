import { BaseReadRepository, commentReactions, commentReports, comments, users } from '@was/db';
import { CommentSort, CommentStatus } from '@was/shared';
import { and, count, desc, eq, inArray, isNull, type SQL, sql } from 'drizzle-orm';

const score = sql<number>`(${comments.likesCount} - ${comments.dislikesCount})`;

/** Read model of the comments tab (threads, replies, counters and reactions). */
export class CommentsRepository extends BaseReadRepository {
  private visible(athleteId: string, ...more: (SQL | undefined)[]) {
    return this.active(comments, eq(comments.athleteId, athleteId), eq(comments.status, CommentStatus.Visible), ...more);
  }

  /**
   * One page of top-level comments, keyset-paginated in the shared `compareThreads` order (score/newest/id). The cursor
   * is the id of the previous page's last thread: its current values are read by a sub-select, so pages never skip or
   * repeat rows whatever the timestamp precision. Fetches `limit + 1` to know whether another page exists.
   */
  topCommentsPage(athleteId: string, sort: CommentSort, cursor: string | null, limit: number) {
    const after = cursor
      ? sort === CommentSort.Recent
        ? sql`(${comments.createdAt}, ${comments.id}) < (select c2.created_at, c2.id from comments c2 where c2.id = ${cursor})`
        : sql`(${score}, ${comments.createdAt}, ${comments.id}) < (select c2.likes_count - c2.dislikes_count, c2.created_at, c2.id from comments c2 where c2.id = ${cursor})`
      : undefined;
    return this.db
      .select({ c: comments, author: users.displayName })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(this.visible(athleteId, isNull(comments.parentCommentId), after))
      .orderBy(...(sort === CommentSort.Recent ? [] : [desc(score)]), desc(comments.createdAt), desc(comments.id))
      .limit(limit + 1);
  }

  /** Visible replies of the given threads. */
  repliesOf(athleteId: string, parentIds: string[]) {
    return parentIds.length
      ? this.db
          .select({ c: comments, author: users.displayName })
          .from(comments)
          .innerJoin(users, eq(users.id, comments.userId))
          .where(this.visible(athleteId, inArray(comments.parentCommentId, parentIds)))
      : Promise.resolve([]);
  }

  /** Every visible comment of an athlete (threads + replies): the `total` of the tab. */
  async countVisibleComments(athleteId: string) {
    return (await this.db.select({ n: count() }).from(comments).where(this.visible(athleteId)))[0]?.n ?? 0;
  }

  async reactionsOf(userId: string, commentIds: string[]) {
    return commentIds.length
      ? this.db
          .select()
          .from(commentReactions)
          .where(this.active(commentReactions, eq(commentReactions.userId, userId), inArray(commentReactions.commentId, commentIds)))
      : [];
  }

  async findComment(id: string) {
    return (
      (
        await this.db
          .select()
          .from(comments)
          .where(this.active(comments, eq(comments.id, id)))
      ).at(0) ?? null
    );
  }

  async findReaction(commentId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(commentReactions)
      .where(this.active(commentReactions, and(eq(commentReactions.commentId, commentId), eq(commentReactions.userId, userId))));
    return rows.at(0) ?? null;
  }

  /** SELECT … FOR UPDATE on the comment (call inside a transaction). */
  async lockComment(id: string): Promise<void> {
    await this.db.select({ id: comments.id }).from(comments).where(eq(comments.id, id)).for('update');
  }

  async findReport(commentId: string, userId: string) {
    const rows = await this.db
      .select()
      .from(commentReports)
      .where(this.active(commentReports, and(eq(commentReports.commentId, commentId), eq(commentReports.userId, userId))));
    return rows.at(0) ?? null;
  }
}
