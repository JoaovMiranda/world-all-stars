// A4 (users + audit), A5 (privacy), A7 (comments + banned words), A8 (suggestions + contact inbox).
import { active, athleteSuggestions, auditLogs, bannedWords, comments, contactMessages, notifications, privacyRequests, users } from '@was/db';
import {
  ADMIN_AUDIT_ACTION_VALUES,
  ADMIN_AUDIT_LOG_LIMIT,
  AdminAuditAction,
  type AdminCommentsResponse,
  type AdminInboxResponse,
  type AdminUsersResponse,
  API_ERROR_MESSAGES,
  ApiErrorCode,
  type AdminAuditAction as AuditAction,
  type BannedWord,
  type CommentStatus,
  type ContactStatus,
  NotificationKind,
  type PrivacyRequest,
  PrivacyRequestStatus,
  SuggestionStatus,
  textFor,
  type UpdateUserRequest,
} from '@was/shared';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { revokeAuthSessions } from '../../auth/auth-user.helper';
import { BaseService } from '../../core/base.service';
import { isoOf } from '../../helpers/date.helper';
import { notFound, unprocessableKey } from '../../http/http-error.helper';
import { ModerationRepository } from '../moderation/moderation.repository';
import { AdminCollectionService } from './admin-collection.service';

/** A4 (users + audit), A5 (privacy), A7 (comments + banned words), A8 (suggestions + contact inbox). */
export class AdminCommunityService extends BaseService {
  // ── A4 · users and the audit log ──
  async listUsers(): Promise<AdminUsersResponse> {
    const [rows, log] = await Promise.all([
      this.db.select().from(users).where(active(users)).orderBy(desc(users.createdAt)),
      this.db
        .select()
        .from(auditLogs)
        .where(active(auditLogs, inArray(auditLogs.action, [...ADMIN_AUDIT_ACTION_VALUES])))
        .orderBy(desc(auditLogs.createdAt))
        .limit(ADMIN_AUDIT_LOG_LIMIT),
    ]);
    return {
      items: rows.map((u) => ({
        id: u.id,
        name: u.displayName,
        email: u.email,
        role: u.role,
        bannedAt: isoOf(u.bannedAt),
        banReason: u.banReason,
        tierVotesCount: u.tierVotesCount,
        commentsCount: u.commentsCount,
        createdAt: u.createdAt.toISOString(),
      })),
      audit: log.map((a) => ({
        id: a.id,
        at: a.createdAt.toISOString(),
        actor: String(a.metadata.actorName ?? 'system'),
        action: a.action as AuditAction,
        target: String(a.metadata.target ?? a.entityId ?? '-'),
        reason: (a.metadata.reason as string | null | undefined) ?? null,
      })),
    };
  }

  async updateUser(id: string, body: UpdateUserRequest) {
    const [target] = await this.db
      .select()
      .from(users)
      .where(active(users, eq(users.id, id)));
    if (!target) throw notFound();
    if (target.id === this.actor.userId) throw unprocessableKey(ApiErrorCode.Validation, 'ownAccount');
    const action = body.role ? AdminAuditAction.RoleChanged : body.banned ? AdminAuditAction.UserBanned : AdminAuditAction.UserUnbanned;
    await this.transaction(async (repo) => {
      await repo.update(
        users,
        id,
        {
          ...(body.role ? { role: body.role } : {}),
          ...(body.banned !== undefined ? { bannedAt: body.banned ? new Date() : null, banReason: body.banned ? body.reason : null } : {}),
        },
        this.actor,
        { reason: body.reason },
      );
      await repo.audit(this.actor, action, { type: 'users', id }, { target: target.displayName, reason: body.reason });
      // A ban signs the account out of every browser right away (new sessions are refused by Better Auth's hook).
      if (body.banned) await revokeAuthSessions(repo.db, id);
    });
    return { ok: true as const };
  }

  // ── A5 · privacy requests ──
  async listPrivacy(): Promise<{ items: PrivacyRequest[] }> {
    const [view, rows] = await Promise.all([
      this.ctx.deps.catalog.get(this.ctx.locale),
      this.db
        .select({ r: privacyRequests, handler: users.displayName })
        .from(privacyRequests)
        .leftJoin(users, eq(users.id, privacyRequests.handledBy))
        .where(active(privacyRequests))
        .orderBy(desc(privacyRequests.createdAt)),
    ]);
    const athleteIds = new Set(view.rows.athletes.map((a) => a.id));
    return {
      items: rows.map(({ r, handler }) => ({
        id: r.id,
        protocol: r.protocol,
        requesterEmail: r.requesterEmail,
        subjectKind: r.subjectKind,
        right: r.right,
        athlete: r.athleteId && athleteIds.has(r.athleteId) ? view.athleteRef(r.athleteId) : null,
        details: r.details,
        status: r.status,
        createdAt: r.createdAt.toISOString(),
        dueAt: r.dueAt.toISOString(),
        answeredAt: isoOf(r.answeredAt),
        handledBy: handler ?? null,
        note: r.note,
      })),
    };
  }

  async updatePrivacy(id: string, status: PrivacyRequestStatus, note: string) {
    const [r] = await this.db
      .select()
      .from(privacyRequests)
      .where(active(privacyRequests, eq(privacyRequests.id, id)));
    if (!r) throw notFound();
    const closed = status === PrivacyRequestStatus.Answered || status === PrivacyRequestStatus.Rejected;
    await this.transaction(async (repo) => {
      await repo.update(privacyRequests, id, { status, note, handledBy: this.actor.userId, answeredAt: closed ? new Date() : null }, this.actor, {
        reason: note,
      });
      await repo.audit(this.actor, AdminAuditAction.PrivacyUpdated, { type: 'privacy_requests', id }, { target: r.protocol, reason: note });
    });
    return { ok: true as const };
  }

  // ── A7 · comments and banned words ──
  async listAdminComments(): Promise<AdminCommentsResponse> {
    // Catalog, comments and banned words are independent: one round-trip instead of three.
    const [view, rows, words] = await Promise.all([
      this.ctx.deps.catalog.get(this.ctx.locale),
      this.db
        .select({ c: comments, author: users.displayName })
        .from(comments)
        .innerJoin(users, eq(users.id, comments.userId))
        .where(active(comments))
        .orderBy(desc(comments.dislikesCount), desc(comments.createdAt)),
      new ModerationRepository(this.db).loadBannedWords(),
    ]);
    const athleteIds = new Set(view.rows.athletes.map((a) => a.id));
    return {
      items: rows.flatMap(({ c, author }) =>
        athleteIds.has(c.athleteId)
          ? [
              {
                id: c.id,
                athlete: view.athleteRef(c.athleteId),
                author,
                body: c.body,
                at: c.createdAt.toISOString(),
                likes: c.likesCount,
                dislikes: c.dislikesCount,
                replies: c.repliesCount,
                status: c.status,
                hiddenReason: c.hiddenReason,
              },
            ]
          : [],
      ),
      bannedWords: words,
    };
  }

  async moderateComment(id: string, status: CommentStatus, reason: string) {
    const [c] = await this.db
      .select()
      .from(comments)
      .where(active(comments, eq(comments.id, id)));
    if (!c) throw notFound();
    await this.transaction(async (repo) => {
      await repo.update(comments, id, { status, hiddenReason: status === 'hidden' ? reason : null }, this.actor, { reason });
      await repo.audit(this.actor, AdminAuditAction.CommentModerated, { type: 'comments', id }, { target: id, reason });
    });
    return { ok: true as const };
  }

  private async findWord(w: Pick<BannedWord, 'term' | 'locale'>) {
    return (
      await this.db
        .select()
        .from(bannedWords)
        .where(active(bannedWords, and(sql`lower(${bannedWords.term}) = ${w.term.toLowerCase()}`, eq(bannedWords.locale, w.locale))))
    ).at(0);
  }

  async addBannedWord(word: BannedWord) {
    if (await this.findWord(word))
      throw unprocessableKey(ApiErrorCode.Validation, 'bannedWordExists', { term: textFor(API_ERROR_MESSAGES, this.ctx.locale).bannedWordExistsField });
    await this.transaction(async (repo) => {
      const row = await repo.insert(bannedWords, { term: word.term.trim(), matchMode: word.matchMode, locale: word.locale }, this.actor);
      await repo.audit(
        this.actor,
        AdminAuditAction.BannedWordAdded,
        { type: 'banned_words', id: row.id },
        { target: `${word.term} (${word.locale})`, reason: null },
      );
    });
    return { ok: true as const };
  }

  async removeBannedWord(word: Pick<BannedWord, 'term' | 'locale'>) {
    const row = await this.findWord(word);
    if (!row) throw notFound();
    await this.transaction(async (repo) => {
      await repo.softDelete(bannedWords, row.id, this.actor);
      await repo.audit(
        this.actor,
        AdminAuditAction.BannedWordRemoved,
        { type: 'banned_words', id: row.id },
        { target: `${word.term} (${word.locale})`, reason: null },
      );
    });
    return { ok: true as const };
  }

  // ── A8 · suggestions and contact messages ──
  async listInbox(): Promise<AdminInboxResponse> {
    const [view, suggestions, messages] = await Promise.all([
      this.ctx.deps.catalog.get(this.ctx.locale),
      this.db.select().from(athleteSuggestions).where(active(athleteSuggestions)).orderBy(desc(athleteSuggestions.createdAt)),
      this.db.select().from(contactMessages).where(active(contactMessages)).orderBy(desc(contactMessages.createdAt)),
    ]);
    const sportSlugs = new Map(view.rows.sports.map((x) => [x.id, x.slug]));
    return {
      suggestions: suggestions.map((s) => ({
        id: s.id,
        protocol: s.protocol,
        athleteName: s.athleteName,
        sport: s.sportId ? (sportSlugs.get(s.sportId) ?? null) : s.sportOther,
        urls: s.urls,
        why: s.justification,
        email: s.contactEmail,
        status: s.status,
        createdAt: s.createdAt.toISOString(),
      })),
      messages: messages.map((m) => ({
        id: m.id,
        protocol: m.protocol,
        name: m.name,
        email: m.email,
        topic: m.topic,
        body: m.body,
        status: m.status,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  }

  /** Approving a suggestion queues its links for the collection (doc 21); the author is notified when signed in. */
  async reviewSuggestion(id: string, status: SuggestionStatus, note: string | undefined) {
    const collection = new AdminCollectionService(this.ctx);
    const [[s], view] = await Promise.all([
      this.db
        .select()
        .from(athleteSuggestions)
        .where(active(athleteSuggestions, eq(athleteSuggestions.id, id))),
      this.ctx.deps.catalog.get(this.ctx.locale),
    ]);
    if (!s) throw notFound();
    const sport = s.sportId ? (view.rows.sports.find((x) => x.id === s.sportId)?.slug ?? null) : s.sportOther;
    const links =
      status === SuggestionStatus.Approved
        ? await collection.prepareCollectionLinks({ athleteName: s.athleteName, sport, urls: s.urls, origin: 'suggestion', suggestionId: s.id })
        : [];
    await this.transaction(async (repo) => {
      await collection.insertCollectionLinks(repo, links);
      await repo.update(athleteSuggestions, id, { status, reviewNote: note ?? null }, this.actor, { reason: note ?? null });
      if (s.userId) {
        await repo.insert(
          notifications,
          {
            userId: s.userId,
            kind: NotificationKind.SuggestionReviewed,
            entityType: 'athlete_suggestions',
            entityId: id,
            actorId: this.actor.userId,
            payload: { excerpt: `${s.protocol} · ${s.athleteName}` },
          },
          this.actor,
        );
      }
      await repo.audit(
        this.actor,
        AdminAuditAction.SuggestionReviewed,
        { type: 'athlete_suggestions', id },
        { target: `${s.protocol} · ${s.athleteName}`, reason: note ?? null },
      );
    });
    return { ok: true as const };
  }

  async updateContactMessage(id: string, status: ContactStatus) {
    const [m] = await this.db
      .select()
      .from(contactMessages)
      .where(active(contactMessages, eq(contactMessages.id, id)));
    if (!m) throw notFound();
    await this.transaction(async (repo) => {
      await repo.update(contactMessages, id, { status }, this.actor);
      await repo.audit(this.actor, AdminAuditAction.MessageUpdated, { type: 'contact_messages', id }, { target: m.protocol, reason: null });
    });
    return { ok: true as const };
  }
}
