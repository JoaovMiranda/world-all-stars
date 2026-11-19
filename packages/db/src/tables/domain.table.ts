// Extensible domain vocabularies (handoff v3 §4.9): formats, compositions, roles, statuses, recognition kinds…
// Competitive values are DATA (seed/admin, on demand), not Postgres enums: a new sport never needs a migration.
import { type AnyPgColumn, index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { baseColumns, live } from '../columns/base.column';
import { domainKindEnum } from '../columns/pg-enum.column';
import { sports } from './sport.table';

export const domainValues = pgTable(
  'domain_values',
  {
    ...baseColumns(),
    domain: domainKindEnum().notNull(),
    slug: text().notNull(),
    /** Scope: null = reusable by every sport; set = only for that sport (e.g. a football position). */
    sportId: uuid().references(() => sports.id),
    /** Hierarchy inside a domain (e.g. a classification value under its scheme). */
    parentId: uuid().references((): AnyPgColumn => domainValues.id),
    sortOrder: integer().notNull().default(0),
    /** Typed per domain in @was/shared (e.g. entry_composition: { minMembers, maxMembers }). */
    attributes: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [
    uniqueIndex('domain_values_global_uq').on(t.domain, t.slug).where(sql`${t.deletedAt} is null and ${t.sportId} is null`),
    uniqueIndex('domain_values_sport_uq').on(t.domain, t.slug, t.sportId).where(sql`${t.deletedAt} is null and ${t.sportId} is not null`),
    index().on(t.domain).where(live(t.deletedAt)),
  ],
);
export const domainValueTranslations = pgTable(
  'domain_value_translations',
  { ...baseColumns(), valueId: uuid().notNull().references(() => domainValues.id), locale: text().notNull(), name: text().notNull(), description: text() },
  (t) => [uniqueIndex().on(t.valueId, t.locale).where(live(t.deletedAt))],
);
