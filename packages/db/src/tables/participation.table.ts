// Reader participation (docs 17/20/21): tier votes, comments, reactions, banned words, suggestions, contact.
import { sql } from 'drizzle-orm';
import { index, integer, pgTable, text, uniqueIndex, uuid, type AnyPgColumn } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import {
  bannedWordMatchModeEnum,
  commentReactionEnum,
  commentStatusEnum,
  contactStatusEnum,
  contactTopicEnum,
  suggestionStatusEnum,
} from '../columns/pg-enum.column';
import { athletes } from './athlete.table';
import { championTiers } from './config.table';
import { sports } from './sport.table';
import { users } from './user.table';

/** One vote per user per athlete (changing it does not change the user counter, doc 17). */
export const tierVotes = pgTable(
  'tier_votes',
  {
    ...baseColumns(),
    userId: uuid().notNull().references(() => users.id),
    athleteId: uuid().notNull().references(() => athletes.id),
    championTierId: uuid().notNull().references(() => championTiers.id),
  },
  (t) => [uniqueIndex().on(t.userId, t.athleteId).where(live(t.deletedAt)), index().on(t.athleteId).where(live(t.deletedAt))],
);

export const comments = pgTable(
  'comments',
  {
    ...baseColumns(),
    athleteId: uuid().notNull().references(() => athletes.id),
    userId: uuid().notNull().references(() => users.id),
    parentCommentId: uuid().references((): AnyPgColumn => comments.id),
    body: text().notNull(),
    status: commentStatusEnum().notNull().default('visible'),
    hiddenReason: text(),
    likesCount: integer().notNull().default(0),
    dislikesCount: integer().notNull().default(0),
    repliesCount: integer().notNull().default(0),
  },
  (t) => [
    // Thread of an athlete: visible comments, newest first.
    index().on(t.athleteId, t.status, t.createdAt).where(live(t.deletedAt)),
    index().on(t.userId, t.createdAt).where(live(t.deletedAt)),
  ],
);

export const commentReactions = pgTable(
  'comment_reactions',
  {
    ...baseColumns(),
    commentId: uuid().notNull().references(() => comments.id),
    userId: uuid().notNull().references(() => users.id),
    reaction: commentReactionEnum().notNull(),
  },
  (t) => [uniqueIndex().on(t.commentId, t.userId).where(live(t.deletedAt))],
);

export const bannedWords = pgTable(
  'banned_words',
  { ...baseColumns(), term: text().notNull(), matchMode: bannedWordMatchModeEnum().notNull(), locale: text().notNull() },
  (t) => [uniqueIndex().on(t.term, t.locale).where(live(t.deletedAt)), index('banned_words_lower_term_idx').on(sql`lower(${t.term})`, t.locale).where(live(t.deletedAt))],
);

/** Public athlete suggestion (doc 21): link mandatory; approved → source_links of the next collection. */
export const athleteSuggestions = pgTable('athlete_suggestions', {
  ...baseColumns(),
  athleteName: text().notNull(),
  sportId: uuid().references(() => sports.id),
  sportOther: text(),
  urls: text().array().notNull(),
  justification: text(),
  contactEmail: text(),
  userId: uuid().references(() => users.id),
  status: suggestionStatusEnum().notNull().default('pending'),
  reviewNote: text(),
  existingAthleteId: uuid().references(() => athletes.id),
  protocol: text().notNull(),
  ipHash: text(),
},
(t) => [index().on(t.createdAt).where(live(t.deletedAt))]);

export const contactMessages = pgTable('contact_messages', {
  ...baseColumns(),
  name: text().notNull(),
  email: text().notNull(),
  topic: contactTopicEnum().notNull(),
  body: text().notNull(),
  userId: uuid().references(() => users.id),
  status: contactStatusEnum().notNull().default('new'),
  protocol: text().notNull(),
  ipHash: text(),
},
(t) => [index().on(t.createdAt).where(live(t.deletedAt))]);
