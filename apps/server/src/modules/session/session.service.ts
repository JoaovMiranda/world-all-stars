import { type Database, active, athletes, championTiers, comments, notifications, tierVotes, users } from '@was/db';
import { type AthleteRef, type MeResponse, type NotificationsResponse, type SessionResponse, type SessionUser } from '@was/shared';
import { and, desc, eq, inArray } from 'drizzle-orm';

import type { AuthUser, SessionContext } from '../../auth/auth-provider.type';
import type { AppDeps } from '../../http/app-context.type';
import { notFound } from '../../http/http-error.error';
import { loadAuthUser } from '../../auth/simulated-auth.provider';

export const sessionUserOf = (u: AuthUser): SessionUser => ({ email: u.email, name: u.name, role: u.role, tierVotesCount: u.tierVotesCount, commentsCount: u.commentsCount });

export const getSession = (session: SessionContext): SessionResponse => ({ kind: session.kind, user: session.user ? sessionUserOf(session.user) : null });

/** Fresh counters (the session was resolved before the handler wrote). */
export const freshSessionUser = async (db: Database, user: AuthUser): Promise<SessionUser> => sessionUserOf((await loadAuthUser(db, { id: user.id })) ?? user);

const athleteRefs = async (db: Database, ids: string[]) => {
  if (!ids.length) return new Map<string, AthleteRef>();
  const rows = await db
    .select({ id: athletes.id, slug: athletes.slug, knownAs: athletes.knownAs, tier: championTiers.slug })
    .from(athletes)
    .innerJoin(championTiers, eq(championTiers.id, athletes.championTierId))
    .where(inArray(athletes.id, ids));
  return new Map(rows.map((r) => [r.id, { slug: r.slug, knownAs: r.knownAs, tier: r.tier }]));
};

/** GET /api/me (E2): my tier votes and my comments. */
export const getMe = async (deps: AppDeps, user: AuthUser): Promise<MeResponse> => {
  const [votes, mine] = await Promise.all([
    deps.db
      .select({ athleteId: tierVotes.athleteId, tier: championTiers.slug, at: tierVotes.updatedAt })
      .from(tierVotes)
      .innerJoin(championTiers, eq(championTiers.id, tierVotes.championTierId))
      .where(active(tierVotes, eq(tierVotes.userId, user.id)))
      .orderBy(desc(tierVotes.updatedAt)),
    deps.db.select().from(comments).where(active(comments, eq(comments.userId, user.id))).orderBy(desc(comments.createdAt)),
  ]);
  const refs = await athleteRefs(deps.db, [...new Set([...votes.map((v) => v.athleteId), ...mine.map((c) => c.athleteId)])]);
  return {
    user: await freshSessionUser(deps.db, user),
    votes: votes.flatMap((v) => (refs.has(v.athleteId) ? [{ athlete: refs.get(v.athleteId)!, tier: v.tier, at: v.at.toISOString() }] : [])),
    comments: mine.flatMap((c) =>
      refs.has(c.athleteId) ? [{ id: c.id, athlete: refs.get(c.athleteId)!, body: c.body, at: c.createdAt.toISOString(), isReply: c.parentCommentId !== null }] : [],
    ),
  };
};

/** GET /api/notifications (E4). */
export const getNotifications = async (deps: AppDeps, user: AuthUser): Promise<NotificationsResponse> => {
  const rows = await deps.db
    .select({ n: notifications, actor: users.displayName })
    .from(notifications)
    .leftJoin(users, eq(users.id, notifications.actorId))
    .where(active(notifications, eq(notifications.userId, user.id)))
    .orderBy(desc(notifications.createdAt));
  const refs = await athleteRefs(deps.db, rows.map((r) => r.n.payload.athleteId).filter((id): id is string => !!id));
  const items = rows.map(({ n, actor }) => ({
    id: n.id,
    kind: n.kind,
    read: n.readAt !== null,
    at: n.createdAt.toISOString(),
    actor: actor ?? null,
    excerpt: n.payload.excerpt ?? null,
    athlete: n.payload.athleteId ? (refs.get(n.payload.athleteId) ?? null) : null,
    commentId: n.payload.commentId ?? null,
  }));
  return { items, unread: items.filter((n) => !n.read).length };
};

/** PATCH /api/notifications/:id/read — only my own notifications. */
export const markNotificationRead = async (deps: AppDeps, user: AuthUser, actor: Parameters<AppDeps['repo']['update']>[3], id: string) => {
  const [n] = await deps.db.select().from(notifications).where(active(notifications, and(eq(notifications.id, id), eq(notifications.userId, user.id))));
  if (!n) throw notFound();
  if (!n.readAt) await deps.repo.update(notifications, n.id, { readAt: new Date() }, actor, { summary: 'read' });
  return { ok: true as const };
};
