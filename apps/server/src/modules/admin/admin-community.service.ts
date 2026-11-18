// A4 (users + audit), A5 (privacy), A7 (comments + banned words), A8 (suggestions + contact inbox).
import {
  active,
  athleteSuggestions,
  auditLogs,
  bannedWords,
  comments,
  contactMessages,
  notifications,
  privacyRequests,
  users,
} from '@was/db';
import {
  ADMIN_AUDIT_ACTION_VALUES,
  ADMIN_AUDIT_LOG_LIMIT,
  API_ERROR_MESSAGES,
  textFor,
  type AdminAuditAction as AuditAction,
  AdminAuditAction,
  type AdminCommentsResponse,
  type AdminInboxResponse,
  type AdminUsersResponse,
  type BannedWord,
  type CommentStatus,
  type ContactStatus,
  NotificationKind,
  PrivacyRequestStatus,
  type PrivacyRequest,
  SuggestionStatus,
  type UpdateUserRequest,
} from '@was/shared';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';

import { revokeAuthSessions } from '../../auth/auth-user.helper';
import type { RequestContext } from '../../http/app-context.type';
import { notFound, unprocessableKey } from '../../http/http-error.error';
import { ApiErrorCode } from '@was/shared';
import { isoOf } from '../catalog/catalog.mapper';
import { loadBannedWords } from '../moderation/moderation.repository';
import { insertCollectionLinks, prepareCollectionLinks } from './admin-collection.service';

// ── A4 · users and the audit log ──
export const listUsers = async ({ deps, locale }: RequestContext): Promise<AdminUsersResponse> => {
  const [rows, log] = await Promise.all([
    deps.db.select().from(users).where(active(users)).orderBy(desc(users.createdAt)),
    deps.db.select().from(auditLogs).where(active(auditLogs, inArray(auditLogs.action, [...ADMIN_AUDIT_ACTION_VALUES]))).orderBy(desc(auditLogs.createdAt)).limit(ADMIN_AUDIT_LOG_LIMIT),
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
};

export const updateUser = async (ctx: RequestContext, id: string, body: UpdateUserRequest) => {
  const [target] = await ctx.deps.db.select().from(users).where(active(users, eq(users.id, id)));
  if (!target) throw notFound();
  if (target.id === ctx.actor.userId) throw unprocessableKey(ApiErrorCode.Validation, 'ownAccount');
  const action = body.role ? AdminAuditAction.RoleChanged : body.banned ? AdminAuditAction.UserBanned : AdminAuditAction.UserUnbanned;
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.update(
      users,
      id,
      {
        ...(body.role ? { role: body.role } : {}),
        ...(body.banned !== undefined ? { bannedAt: body.banned ? new Date() : null, banReason: body.banned ? body.reason : null } : {}),
      },
      ctx.actor,
      { reason: body.reason },
    );
    await repo.audit(ctx.actor, action, { type: 'users', id }, { target: target.displayName, reason: body.reason });
    // A ban signs the account out of every browser right away (new sessions are refused by Better Auth's hook).
    if (body.banned) await revokeAuthSessions(repo.db, id);
  });
  return { ok: true as const };
};

// ── A5 · privacy requests ──
export const listPrivacy = async ({ deps, locale }: RequestContext): Promise<{ items: PrivacyRequest[] }> => {
  const [view, rows] = await Promise.all([
    deps.catalog.get(locale),
    deps.db
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
};

export const updatePrivacy = async (ctx: RequestContext, id: string, status: PrivacyRequestStatus, note: string) => {
  const [r] = await ctx.deps.db.select().from(privacyRequests).where(active(privacyRequests, eq(privacyRequests.id, id)));
  if (!r) throw notFound();
  const closed = status === PrivacyRequestStatus.Answered || status === PrivacyRequestStatus.Rejected;
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.update(privacyRequests, id, { status, note, handledBy: ctx.actor.userId, answeredAt: closed ? new Date() : null }, ctx.actor, { reason: note });
    await repo.audit(ctx.actor, AdminAuditAction.PrivacyUpdated, { type: 'privacy_requests', id }, { target: r.protocol, reason: note });
  });
  return { ok: true as const };
};

// ── A7 · comments and banned words ──
export const listAdminComments = async ({ deps, locale }: RequestContext): Promise<AdminCommentsResponse> => {
  // Catalog, comments and banned words are independent: one round-trip instead of three.
  const [view, rows, words] = await Promise.all([
    deps.catalog.get(locale),
    deps.db
      .select({ c: comments, author: users.displayName })
      .from(comments)
      .innerJoin(users, eq(users.id, comments.userId))
      .where(active(comments))
      .orderBy(desc(comments.dislikesCount), desc(comments.createdAt)),
    loadBannedWords(deps.db),
  ]);
  const athleteIds = new Set(view.rows.athletes.map((a) => a.id));
  return {
    items: rows.flatMap(({ c, author }) =>
      athleteIds.has(c.athleteId)
        ? [{ id: c.id, athlete: view.athleteRef(c.athleteId), author, body: c.body, at: c.createdAt.toISOString(), likes: c.likesCount, dislikes: c.dislikesCount, replies: c.repliesCount, status: c.status, hiddenReason: c.hiddenReason }]
        : [],
    ),
    bannedWords: words,
  };
};

export const moderateComment = async (ctx: RequestContext, id: string, status: CommentStatus, reason: string) => {
  const [c] = await ctx.deps.db.select().from(comments).where(active(comments, eq(comments.id, id)));
  if (!c) throw notFound();
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.update(comments, id, { status, hiddenReason: status === 'hidden' ? reason : null }, ctx.actor, { reason });
    await repo.audit(ctx.actor, AdminAuditAction.CommentModerated, { type: 'comments', id }, { target: id, reason });
  });
  return { ok: true as const };
};

const findWord = async (ctx: RequestContext, w: Pick<BannedWord, 'term' | 'locale'>) =>
  (await ctx.deps.db.select().from(bannedWords).where(active(bannedWords, and(sql`lower(${bannedWords.term}) = ${w.term.toLowerCase()}`, eq(bannedWords.locale, w.locale))))).at(0);

export const addBannedWord = async (ctx: RequestContext, word: BannedWord) => {
  if (await findWord(ctx, word)) throw unprocessableKey(ApiErrorCode.Validation, 'bannedWordExists', { term: textFor(API_ERROR_MESSAGES, ctx.locale).bannedWordExistsField });
  await ctx.deps.repo.transaction(async (repo) => {
    const row = await repo.insert(bannedWords, { term: word.term.trim(), matchMode: word.matchMode, locale: word.locale }, ctx.actor);
    await repo.audit(ctx.actor, AdminAuditAction.BannedWordAdded, { type: 'banned_words', id: row.id }, { target: `${word.term} (${word.locale})`, reason: null });
  });
  return { ok: true as const };
};

export const removeBannedWord = async (ctx: RequestContext, word: Pick<BannedWord, 'term' | 'locale'>) => {
  const row = await findWord(ctx, word);
  if (!row) throw notFound();
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.softDelete(bannedWords, row.id, ctx.actor);
    await repo.audit(ctx.actor, AdminAuditAction.BannedWordRemoved, { type: 'banned_words', id: row.id }, { target: `${word.term} (${word.locale})`, reason: null });
  });
  return { ok: true as const };
};

// ── A8 · suggestions and contact messages ──
export const listInbox = async ({ deps, locale }: RequestContext): Promise<AdminInboxResponse> => {
  const [view, suggestions, messages] = await Promise.all([
    deps.catalog.get(locale),
    deps.db.select().from(athleteSuggestions).where(active(athleteSuggestions)).orderBy(desc(athleteSuggestions.createdAt)),
    deps.db.select().from(contactMessages).where(active(contactMessages)).orderBy(desc(contactMessages.createdAt)),
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
    messages: messages.map((m) => ({ id: m.id, protocol: m.protocol, name: m.name, email: m.email, topic: m.topic, body: m.body, status: m.status, createdAt: m.createdAt.toISOString() })),
  };
};

/** Approving a suggestion queues its links for the collection (doc 21); the author is notified when signed in. */
export const reviewSuggestion = async (ctx: RequestContext, id: string, status: SuggestionStatus, note: string | undefined) => {
  const [[s], view] = await Promise.all([
    ctx.deps.db.select().from(athleteSuggestions).where(active(athleteSuggestions, eq(athleteSuggestions.id, id))),
    ctx.deps.catalog.get(ctx.locale),
  ]);
  if (!s) throw notFound();
  const sport = s.sportId ? (view.rows.sports.find((x) => x.id === s.sportId)?.slug ?? null) : s.sportOther;
  const links = status === SuggestionStatus.Approved ? await prepareCollectionLinks(ctx, { athleteName: s.athleteName, sport, urls: s.urls, origin: 'suggestion', suggestionId: s.id }) : [];
  await ctx.deps.repo.transaction(async (repo) => {
    await insertCollectionLinks(repo, ctx.actor, links);
    await repo.update(athleteSuggestions, id, { status, reviewNote: note ?? null }, ctx.actor, { reason: note ?? null });
    if (s.userId) {
      await repo.insert(notifications, { userId: s.userId, kind: NotificationKind.SuggestionReviewed, entityType: 'athlete_suggestions', entityId: id, actorId: ctx.actor.userId, payload: { excerpt: `${s.protocol} · ${s.athleteName}` } }, ctx.actor);
    }
    await repo.audit(ctx.actor, AdminAuditAction.SuggestionReviewed, { type: 'athlete_suggestions', id }, { target: `${s.protocol} · ${s.athleteName}`, reason: note ?? null });
  });
  return { ok: true as const };
};

export const updateContactMessage = async (ctx: RequestContext, id: string, status: ContactStatus) => {
  const [m] = await ctx.deps.db.select().from(contactMessages).where(active(contactMessages, eq(contactMessages.id, id)));
  if (!m) throw notFound();
  await ctx.deps.repo.transaction(async (repo) => {
    await repo.update(contactMessages, id, { status }, ctx.actor);
    await repo.audit(ctx.actor, AdminAuditAction.MessageUpdated, { type: 'contact_messages', id }, { target: m.protocol, reason: null });
  });
  return { ok: true as const };
};

