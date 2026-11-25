// Reader interactions with competitors (D02/D03): one exclusive star per account and unlimited hearts. Only the
// aggregate counts are public (view competitor_interaction_counts); each account's own list is private.
import { sql } from 'drizzle-orm';
import { index, integer, pgTable, pgView, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { competitors } from './registry.table';
import { users } from './user.table';

/** The account's ONE star (exclusive): moving it to another competitor updates this row in one transaction. */
export const competitorStars = pgTable(
  'competitor_stars',
  {
    ...baseColumns(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    competitorId: uuid()
      .notNull()
      .references(() => competitors.id),
  },
  (t) => [uniqueIndex().on(t.userId).where(live(t.deletedAt)), index().on(t.competitorId).where(live(t.deletedAt))],
);

/** Hearts: as many competitors as the account wants, one heart per competitor (toggle = insert / soft delete). */
export const competitorHearts = pgTable(
  'competitor_hearts',
  {
    ...baseColumns(),
    userId: uuid()
      .notNull()
      .references(() => users.id),
    competitorId: uuid()
      .notNull()
      .references(() => competitors.id),
  },
  (t) => [uniqueIndex().on(t.userId, t.competitorId).where(live(t.deletedAt)), index().on(t.competitorId).where(live(t.deletedAt))],
);

/** Public read model: live stars and hearts per competitor (competitors without any are absent). */
export const competitorInteractionCounts = pgView('competitor_interaction_counts', {
  competitorId: uuid().notNull(),
  starsCount: integer().notNull(),
  heartsCount: integer().notNull(),
}).as(
  sql`select competitor_id, sum(stars)::int as stars_count, sum(hearts)::int as hearts_count from (
    select competitor_id, 1 as stars, 0 as hearts from competitor_stars where deleted_at is null
    union all
    select competitor_id, 0 as stars, 1 as hearts from competitor_hearts where deleted_at is null
  ) as interactions group by competitor_id`,
);
