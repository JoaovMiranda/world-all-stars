import { active, athletes, championTiers, comments, notifications, tierVotes, users } from '@was/db';
import { type AthleteRef, type MeResponse, NOTIFICATIONS_LIMIT, type NotificationsResponse, type SessionResponse, type SessionUser } from '@was/shared';
import { and, count, desc, eq, inArray, isNull } from 'drizzle-orm';

import type { AuthUser } from '../../auth/auth-provider.type';
import { loadAuthUser } from '../../auth/auth-user.helper';
import { BaseService } from '../../core/base.service';

const sessionUserOf = (u: AuthUser): SessionUser => ({
  email: u.email,
  name: u.name,
  avatarUrl: u.avatarUrl,
  role: u.role,
  tierVotesCount: u.tierVotesCount,
  commentsCount: u.commentsCount,
});

/** Session, "me" page (E2) and notifications (E4). */
export class SessionService extends BaseService {
  /** GET /api/session: who is browsing + what the login dialog can offer (Google configured, dev switcher). */
  getSession(): SessionResponse {
    const { session, deps } = this.ctx;
    return {
      kind: session.kind,
      user: session.user ? sessionUserOf(session.user) : null,
      pendingConsent: session.pending ? { email: session.pending.email, name: session.pending.name } : null,
      simulated: deps.config.authSimulated,
      googleEnabled: deps.config.google !== null,
    };
  }

  /** Fresh counters (the session was resolved before the handler wrote). */
  private async freshSessionUser(user: AuthUser): Promise<SessionUser> {
    return sessionUserOf((await loadAuthUser(this.db, { id: user.id })) ?? user);
  }

  private async athleteRefs(ids: string[]) {
    if (!ids.length) return new Map<string, AthleteRef>();
    const rows = await this.db
      .select({ id: athletes.id, slug: athletes.slug, knownAs: athletes.knownAs, tier: championTiers.slug })
      .from(athletes)
      .innerJoin(championTiers, eq(championTiers.id, athletes.championTierId))
      .where(inArray(athletes.id, ids));
    return new Map(rows.map((r) => [r.id, { slug: r.slug, knownAs: r.knownAs, tier: r.tier }]));
  }

  /** GET /api/me (E2): my tier votes and my comments. */
  async getMe(user: AuthUser): Promise<MeResponse> {
    const [votes, mine] = await Promise.all([
      this.db
        .select({ athleteId: tierVotes.athleteId, tier: championTiers.slug, at: tierVotes.updatedAt })
        .from(tierVotes)
        .innerJoin(championTiers, eq(championTiers.id, tierVotes.championTierId))
        .where(active(tierVotes, eq(tierVotes.userId, user.id)))
        .orderBy(desc(tierVotes.updatedAt)),
      this.db
        .select()
        .from(comments)
        .where(active(comments, eq(comments.userId, user.id)))
        .orderBy(desc(comments.createdAt)),
    ]);
    // Independent reads: athlete refs of my votes/comments and the fresh counters.
    const [refs, fresh] = await Promise.all([
      this.athleteRefs([...new Set([...votes.map((v) => v.athleteId), ...mine.map((c) => c.athleteId)])]),
      this.freshSessionUser(user),
    ]);
    return {
      user: fresh,
      votes: votes.flatMap((v) => (refs.has(v.athleteId) ? [{ athlete: refs.get(v.athleteId)!, tier: v.tier, at: v.at.toISOString() }] : [])),
      comments: mine.flatMap((c) =>
        refs.has(c.athleteId)
          ? [{ id: c.id, athlete: refs.get(c.athleteId)!, body: c.body, at: c.createdAt.toISOString(), isReply: c.parentCommentId !== null }]
          : [],
      ),
    };
  }

  /** GET /api/notifications (E4). */
  async getNotifications(user: AuthUser): Promise<NotificationsResponse> {
    const mine = active(notifications, eq(notifications.userId, user.id));
    // The newest NOTIFICATIONS_LIMIT are listed; the unread counter covers all of them (one indexed count).
    const [rows, [unread]] = await Promise.all([
      this.db
        .select({ n: notifications, actor: users.displayName })
        .from(notifications)
        .leftJoin(users, eq(users.id, notifications.actorId))
        .where(mine)
        .orderBy(desc(notifications.createdAt))
        .limit(NOTIFICATIONS_LIMIT),
      this.db
        .select({ n: count() })
        .from(notifications)
        .where(and(mine, isNull(notifications.readAt))),
    ]);
    const refs = await this.athleteRefs(rows.map((r) => r.n.payload.athleteId).filter((id): id is string => !!id));
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
    return { items, unread: unread?.n ?? 0 };
  }

  /** PATCH /api/notifications/:id/read — only my own notifications. */
  async markNotificationRead(user: AuthUser, id: string) {
    const [n] = await this.db
      .select()
      .from(notifications)
      .where(active(notifications, and(eq(notifications.id, id), eq(notifications.userId, user.id))));
    const found = this.notFound(n);
    if (!found.readAt) await this.repo.update(notifications, found.id, { readAt: new Date() }, this.actor, { summary: 'read' });
    return { ok: true as const };
  }
}
