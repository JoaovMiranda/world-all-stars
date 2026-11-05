import { type Database, active, commentReactions, comments, users } from '@was/db';
import { CommentStatus } from '@was/shared';
import { and, eq, inArray } from 'drizzle-orm';

/** Visible comments of an athlete with the author's public name (anonymized accounts keep their pseudonym). */
export const visibleComments = (db: Database, athleteId: string) =>
  db
    .select({ c: comments, author: users.displayName })
    .from(comments)
    .innerJoin(users, eq(users.id, comments.userId))
    .where(active(comments, eq(comments.athleteId, athleteId), eq(comments.status, CommentStatus.Visible)));

export const reactionsOf = async (db: Database, userId: string, commentIds: string[]) =>
  commentIds.length
    ? db.select().from(commentReactions).where(active(commentReactions, eq(commentReactions.userId, userId), inArray(commentReactions.commentId, commentIds)))
    : [];

export const findComment = async (db: Database, id: string) => (await db.select().from(comments).where(active(comments, eq(comments.id, id)))).at(0) ?? null;

export const findReaction = async (db: Database, commentId: string, userId: string) =>
  (await db.select().from(commentReactions).where(active(commentReactions, and(eq(commentReactions.commentId, commentId), eq(commentReactions.userId, userId))))).at(0) ?? null;
