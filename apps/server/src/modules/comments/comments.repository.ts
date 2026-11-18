import { type Database, active, commentReactions, comments, users } from '@was/db';
import { CommentSort, CommentStatus } from '@was/shared';
import { and, count, desc, eq, inArray, isNull, type SQL, sql } from 'drizzle-orm';

const visible = (athleteId: string, ...more: (SQL | undefined)[]) => active(comments, eq(comments.athleteId, athleteId), eq(comments.status, CommentStatus.Visible), ...more);
const score = sql<number>`(${comments.likesCount} - ${comments.dislikesCount})`;

/**
 * One page of top-level comments, keyset-paginated in the shared `compareThreads` order (score/newest/id). The cursor
 * is the id of the previous page's last thread: its current values are read by a sub-select, so pages never skip or
 * repeat rows whatever the timestamp precision. Fetches `limit + 1` to know whether another page exists.
 */
export const topCommentsPage = (db: Database, athleteId: string, sort: CommentSort, cursor: string | null, limit: number) => {
  const after = cursor
    ? sort === CommentSort.Recent
      ? sql`(${comments.createdAt}, ${comments.id}) < (select c2.created_at, c2.id from comments c2 where c2.id = ${cursor})`
      : sql`(${score}, ${comments.createdAt}, ${comments.id}) < (select c2.likes_count - c2.dislikes_count, c2.created_at, c2.id from comments c2 where c2.id = ${cursor})`
    : undefined;
  return db
    .select({ c: comments, author: users.displayName })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(visible(athleteId, isNull(comments.parentCommentId), after))
    .orderBy(...(sort === CommentSort.Recent ? [] : [desc(score)]), desc(comments.createdAt), desc(comments.id))
    .limit(limit + 1);
};

/** Visible replies of the given threads. */
export const repliesOf = (db: Database, athleteId: string, parentIds: string[]) =>
  parentIds.length
    ? db
        .select({ c: comments, author: users.displayName })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(visible(athleteId, inArray(comments.parentCommentId, parentIds)))
    : Promise.resolve([]);

/** Every visible comment of an athlete (threads + replies): the `total` of the tab. */
export const countVisibleComments = async (db: Database, athleteId: string) => (await db.select({ n: count() }).from(comments).where(visible(athleteId)))[0]?.n ?? 0;

export const reactionsOf = async (db: Database, userId: string, commentIds: string[]) =>
  commentIds.length
    ? db.select().from(commentReactions).where(active(commentReactions, eq(commentReactions.userId, userId), inArray(commentReactions.commentId, commentIds)))
    : [];

export const findComment = async (db: Database, id: string) => (await db.select().from(comments).where(active(comments, eq(comments.id, id)))).at(0) ?? null;

export const findReaction = async (db: Database, commentId: string, userId: string) =>
  (await db.select().from(commentReactions).where(active(commentReactions, and(eq(commentReactions.commentId, commentId), eq(commentReactions.userId, userId))))).at(0) ?? null;
