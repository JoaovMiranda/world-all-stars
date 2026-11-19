// Sports taxonomy (doc 03/18/19): group › subgroup › sport › categories, governing bodies, collection reports.
import { type AnyPgColumn, boolean, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { governanceModels } from './config.table';
import { organizations } from './organization.table';

export const sportGroups = pgTable(
  'sport_groups',
  { ...baseColumns(), slug: text().notNull(), sortOrder: integer().notNull() },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const sportGroupTranslations = pgTable(
  'sport_group_translations',
  { ...baseColumns(), groupId: uuid().notNull().references(() => sportGroups.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.groupId, t.locale).where(live(t.deletedAt))],
);

export const sportSubgroups = pgTable(
  'sport_subgroups',
  { ...baseColumns(), groupId: uuid().notNull().references(() => sportGroups.id), slug: text().notNull(), sortOrder: integer().notNull() },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const sportSubgroupTranslations = pgTable(
  'sport_subgroup_translations',
  { ...baseColumns(), subgroupId: uuid().notNull().references(() => sportSubgroups.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.subgroupId, t.locale).where(live(t.deletedAt))],
);

export const sports = pgTable(
  'sports',
  {
    ...baseColumns(),
    subgroupId: uuid().notNull().references(() => sportSubgroups.id),
    slug: text().notNull(),
    wikipediaUrl: text(),
    wikidataQid: text(),
    isTeamSport: boolean().notNull().default(false),
    statsSchemaKey: text().notNull(),
    colorToken: text().notNull(),
    governanceModelId: uuid().references(() => governanceModels.id),
    environment: text().notNull(),
    format: text().notNull(),
    /** sport / discipline / variant / style (domain taxon_level; FK in migration 0006). */
    taxonLevelId: uuid(),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const sportTranslations = pgTable(
  'sport_translations',
  {
    ...baseColumns(),
    sportId: uuid().notNull().references(() => sports.id),
    locale: text().notNull(),
    name: text().notNull(),
    description: text(),
    rulesSummary: text(),
    pinnacle: text(),
  },
  (t) => [uniqueIndex().on(t.sportId, t.locale).where(live(t.deletedAt))],
);

export const sportCategories = pgTable(
  'sport_categories',
  {
    ...baseColumns(),
    sportId: uuid().notNull().references(() => sports.id),
    parentCategoryId: uuid().references((): AnyPgColumn => sportCategories.id),
    slug: text().notNull(),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [uniqueIndex().on(t.sportId, t.slug).where(live(t.deletedAt))],
);
export const sportCategoryTranslations = pgTable(
  'sport_category_translations',
  { ...baseColumns(), categoryId: uuid().notNull().references(() => sportCategories.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.categoryId, t.locale).where(live(t.deletedAt))],
);

/** Who governs a sport and in which role (world federation, sanctioning body, publisher…), doc 18/19. */
export const sportGoverningBodies = pgTable(
  'sport_governing_bodies',
  {
    ...baseColumns(),
    sportId: uuid().notNull().references(() => sports.id),
    organizationId: uuid().notNull().references(() => organizations.id),
    role: text().notNull(),
  },
  (t) => [uniqueIndex().on(t.sportId, t.organizationId, t.role).where(live(t.deletedAt))],
);

/** Report of a simulated collection that found no athlete for a sport (doc 18): reason + facts with evidence. */
export const sportCollectionReports = pgTable(
  'sport_collection_reports',
  { ...baseColumns(), sportId: uuid().notNull().references(() => sports.id), reason: text().notNull(), facts: jsonb().$type<Record<string, unknown>[]>().notNull() },
  (t) => [uniqueIndex().on(t.sportId).where(live(t.deletedAt))],
);
