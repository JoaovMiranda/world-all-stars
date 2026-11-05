// Competitions, editions, awards and teams (doc 03 "Competições, prêmios e troféus").
import { boolean, date, index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { competitionStatusEnum } from '../columns/pg-enum.column';
import { competitionLevels, prizeForms } from './config.table';
import { calendarDays, cities, countries } from './geography.table';
import { organizations } from './organization.table';
import { sportCategories, sports } from './sport.table';

export const competitions = pgTable(
  'competitions',
  {
    ...baseColumns(),
    slug: text().notNull(),
    sportId: uuid().notNull().references(() => sports.id),
    sportCategoryId: uuid().references(() => sportCategories.id),
    organizationId: uuid().notNull().references(() => organizations.id),
    competitionLevelId: uuid().notNull().references(() => competitionLevels.id),
    isOlympic: boolean().notNull().default(false),
    scopeCountryId: uuid().references(() => countries.id),
    periodicity: text(),
    prizeFormId: uuid().references(() => prizeForms.id),
    wikidataQid: text(),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const competitionTranslations = pgTable(
  'competition_translations',
  { ...baseColumns(), competitionId: uuid().notNull().references(() => competitions.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.competitionId, t.locale).where(live(t.deletedAt))],
);

export const competitionEditions = pgTable(
  'competition_editions',
  {
    ...baseColumns(),
    competitionId: uuid().notNull().references(() => competitions.id),
    editionNumber: integer(),
    year: integer().notNull(),
    startCalendarDayId: uuid().references(() => calendarDays.id),
    startYear: integer(),
    endCalendarDayId: uuid().references(() => calendarDays.id),
    endYear: integer(),
    startDate: date({ mode: 'string' }),
    endDate: date({ mode: 'string' }),
    status: competitionStatusEnum().notNull().default('finished'),
    hostCountryId: uuid().references(() => countries.id),
    hostCityId: uuid().references(() => cities.id),
    label: text(),
    isExample: boolean().notNull().default(false),
  },
  (t) => [index().on(t.startDate, t.endDate).where(live(t.deletedAt))],
);

export const awards = pgTable(
  'awards',
  {
    ...baseColumns(),
    slug: text().notNull(),
    sportId: uuid().references(() => sports.id),
    organizationId: uuid().references(() => organizations.id),
    competitionLevelId: uuid().notNull().references(() => competitionLevels.id),
    awardKind: text().notNull(),
    prizeFormId: uuid().references(() => prizeForms.id),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const awardTranslations = pgTable(
  'award_translations',
  { ...baseColumns(), awardId: uuid().notNull().references(() => awards.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.awardId, t.locale).where(live(t.deletedAt))],
);
export const awardEditions = pgTable('award_editions', {
  ...baseColumns(),
  awardId: uuid().notNull().references(() => awards.id),
  year: integer().notNull(),
  calendarDayId: uuid().references(() => calendarDays.id),
  label: text(),
});

export const teams = pgTable(
  'teams',
  {
    ...baseColumns(),
    slug: text().notNull(),
    sportId: uuid().references(() => sports.id),
    countryId: uuid().references(() => countries.id),
    kind: text().notNull(),
    name: text().notNull(),
    wikidataQid: text(),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
