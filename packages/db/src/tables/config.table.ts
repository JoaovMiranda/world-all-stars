// Configuration aspects (doc 03 "exception: enums"): created by migration/seed, never on demand.
import { boolean, integer, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { pgTable } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { competitionLevelEnum, governanceModelEnum, orgNatureEnum, tierEnum } from '../columns/pg-enum.column';

export const competitionLevels = pgTable(
  'competition_levels',
  { ...baseColumns(), slug: competitionLevelEnum().notNull(), weight: real().notNull(), sortOrder: integer().notNull() },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);

export const championTiers = pgTable(
  'champion_tiers',
  { ...baseColumns(), slug: tierEnum().notNull(), sortOrder: integer().notNull(), minPercentile: integer(), requiresDossier: boolean().notNull().default(false) },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);

export const achievementTypes = pgTable(
  'achievement_types',
  { ...baseColumns(), slug: text().notNull(), rankWeight: real().notNull() },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);

export const governanceModels = pgTable(
  'governance_models',
  { ...baseColumns(), slug: governanceModelEnum().notNull(), sortOrder: integer().notNull() },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const governanceModelTranslations = pgTable(
  'governance_model_translations',
  { ...baseColumns(), governanceModelId: uuid().notNull().references(() => governanceModels.id), locale: text().notNull(), name: text().notNull(), summary: text().notNull() },
  (t) => [uniqueIndex().on(t.governanceModelId, t.locale).where(live(t.deletedAt))],
);

export const prizeForms = pgTable(
  'prize_forms',
  { ...baseColumns(), slug: text().notNull(), sortOrder: integer().notNull() },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const prizeFormTranslations = pgTable(
  'prize_form_translations',
  { ...baseColumns(), prizeFormId: uuid().notNull().references(() => prizeForms.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.prizeFormId, t.locale).where(live(t.deletedAt))],
);

export const organizationKinds = pgTable(
  'organization_kinds',
  { ...baseColumns(), slug: text().notNull(), nature: orgNatureEnum().notNull(), sortOrder: integer().notNull() },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const organizationKindTranslations = pgTable(
  'organization_kind_translations',
  { ...baseColumns(), organizationKindId: uuid().notNull().references(() => organizationKinds.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.organizationKindId, t.locale).where(live(t.deletedAt))],
);
