// Accounts and what belongs to them: legal acceptances, optional consents, notifications, privacy requests (docs 13/17/20).
import { boolean, index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live, timestamptz } from '../columns/base.column';
import {
  consentPurposeEnum,
  legalDocumentKindEnum,
  notificationKindEnum,
  privacyRequestStatusEnum,
  privacyRightEnum,
  privacySubjectKindEnum,
  userRoleEnum,
} from '../columns/pg-enum.column';
import { athletes } from './athlete.table';

/**
 * Accounts (doc 03). Better Auth reads/writes this table as its `user` model (auth/better-auth.config.ts: name→display_name,
 * image→avatar_url); its sessions/accounts/verifications live in auth.table.ts.
 */
export const users = pgTable(
  'users',
  {
    ...baseColumns(),
    email: text().notNull(),
    displayName: text().notNull(),
    avatarUrl: text(),
    role: userRoleEnum().notNull().default('reader'),
    /** Better Auth's flag; kept in sync with emailVerifiedAt (the audit-friendly instant) by its database hooks. */
    emailVerified: boolean().notNull().default(false),
    emailVerifiedAt: timestamptz(),
    locale: text().notNull().default('pt-BR'),
    bannedAt: timestamptz(),
    banReason: text(),
    tierVotesCount: integer().notNull().default(0),
    commentsCount: integer().notNull().default(0),
  },
  (t) => [uniqueIndex().on(t.email).where(live(t.deletedAt))],
);

/** Acceptance of a legal document version at sign-up (doc 13; bodies/versions live in @was/shared). */
export const legalAcceptances = pgTable(
  'legal_acceptances',
  {
    ...baseColumns(),
    userId: uuid().notNull().references(() => users.id),
    documentKind: legalDocumentKindEnum().notNull(),
    documentVersion: text().notNull(),
    acceptedAt: timestamptz().notNull(),
    ipHash: text(),
  },
  (t) => [uniqueIndex().on(t.userId, t.documentKind, t.documentVersion).where(live(t.deletedAt))],
);

/** Optional purposes the user granted or revoked (E6). */
export const userConsents = pgTable(
  'user_consents',
  { ...baseColumns(), userId: uuid().notNull().references(() => users.id), purpose: consentPurposeEnum().notNull(), granted: boolean().notNull(), decidedAt: timestamptz().notNull() },
  (t) => [uniqueIndex().on(t.userId, t.purpose).where(live(t.deletedAt))],
);

export const notifications = pgTable(
  'notifications',
  {
    ...baseColumns(),
    userId: uuid().notNull().references(() => users.id),
    kind: notificationKindEnum().notNull(),
    entityType: text(),
    entityId: uuid(),
    actorId: uuid(),
    /** { excerpt, athleteId, commentId } */
    payload: jsonb().$type<{ excerpt?: string | null; athleteId?: string | null; commentId?: string | null }>().notNull().default({}),
    readAt: timestamptz(),
    emailedAt: timestamptz(),
  },
  (t) => [index().on(t.userId).where(live(t.deletedAt))],
);

/** LGPD requests (A5) with the legal deadline (doc 13). */
export const privacyRequests = pgTable('privacy_requests', {
  ...baseColumns(),
  protocol: text().notNull(),
  requesterEmail: text().notNull(),
  userId: uuid().references(() => users.id),
  subjectKind: privacySubjectKindEnum().notNull(),
  right: privacyRightEnum().notNull(),
  athleteId: uuid().references(() => athletes.id),
  details: text().notNull(),
  status: privacyRequestStatusEnum().notNull().default('open'),
  dueAt: timestamptz().notNull(),
  answeredAt: timestamptz(),
  handledBy: uuid().references(() => users.id),
  note: text(),
});
