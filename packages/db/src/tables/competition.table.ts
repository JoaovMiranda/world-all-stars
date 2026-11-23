// Competitions, editions and teams (doc 03 "Competitions, awards and trophies"; awards are recognition definitions).
import { boolean, date, index, integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { competitionStatusEnum } from '../columns/pg-enum.column';
import { competitionLevels, prizeForms } from './config.table';
import { calendarDays, cities, countries } from './geography.table';
import { organizations } from './organization.table';
import { sports } from './sport.table';
import { categorySets } from './taxonomy.table';

export const competitions = pgTable(
  'competitions',
  {
    ...baseColumns(),
    slug: text().notNull(),
    /** Null only for multi-sport events (Olympic Games, World Games…): CHECK in migration 0009. */
    sportId: uuid().references(() => sports.id),
    /** Category (division) of the competition: a category set of its sport. */
    sportCategoryId: uuid().references(() => categorySets.id),
    organizationId: uuid().notNull().references(() => organizations.id),
    competitionLevelId: uuid().notNull().references(() => competitionLevels.id),
    isOlympic: boolean().notNull().default(false),
    scopeCountryId: uuid().references(() => countries.id),
    periodicity: text(),
    prizeFormId: uuid().references(() => prizeForms.id),
    wikidataQid: text(),
    /** Default competition format (domain; FK in migration 0006): events may override. */
    formatId: uuid(),
    /** Multi-sport event (Olympic Games, World Games…): its programme lists sports (competition_program_sports). */
    isMultiSport: boolean().notNull().default(false),
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
    /** Null for seasons/cycles/single events without a single year (handoff v3 §4.3). */
    year: integer(),
    /** edition / season / cycle / single_event / series (domain edition_kind; FK in migration 0006). */
    editionKindId: uuid(),
    rulesetId: uuid(),
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
