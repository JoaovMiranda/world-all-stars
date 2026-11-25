// Athletes and everything tied to them (doc 03 "Entidades principais").
import { boolean, date, index, integer, jsonb, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { athleteStatusEnum, milestoneKindEnum } from '../columns/pg-enum.column';
import { achievementTypes, championTiers } from './config.table';
import { competitionEditions, competitions, teams } from './competition.table';
import { calendarDays, cities, countries } from './geography.table';
import { mediaLinks, sourceLinks } from './source.table';
import { sports } from './sport.table';
import { categorySets } from './taxonomy.table';

export const athletes = pgTable(
  'athletes',
  {
    ...baseColumns(),
    slug: text().notNull(),
    fullName: text(),
    knownAs: text().notNull(),
    gender: text(),
    birthCalendarDayId: uuid().references(() => calendarDays.id),
    birthYear: integer(),
    birthDate: date({ mode: 'string' }),
    birthCityId: uuid().references(() => cities.id),
    deathCalendarDayId: uuid().references(() => calendarDays.id),
    deathYear: integer(),
    deathDate: date({ mode: 'string' }),
    deathCityId: uuid().references(() => cities.id),
    heightCm: integer(),
    dominantHand: text(),
    dominantFoot: text(),
    careerStartYear: integer(),
    careerEndYear: integer(),
    status: athleteStatusEnum().notNull(),
    photoMediaLinkId: uuid().references(() => mediaLinks.id),
    championTierId: uuid().notNull().references(() => championTiers.id),
    legacyScore: real(),
    legacyPercentile: real().notNull().default(0),
    inclusionReason: text(),
    lockedFields: text().array().notNull().default([]),
  },
  (t) => [
    uniqueIndex().on(t.slug).where(live(t.deletedAt)),
    index().on(t.birthCalendarDayId).where(live(t.deletedAt)),
    index().on(t.deathCalendarDayId).where(live(t.deletedAt)),
  ],
);
export const athleteTranslations = pgTable(
  'athlete_translations',
  { ...baseColumns(), athleteId: uuid().notNull().references(() => athletes.id), locale: text().notNull(), shortBio: text() },
  (t) => [uniqueIndex().on(t.athleteId, t.locale).where(live(t.deletedAt))],
);

export const athleteSports = pgTable(
  'athlete_sports',
  {
    ...baseColumns(),
    athleteId: uuid().notNull().references(() => athletes.id),
    sportId: uuid().notNull().references(() => sports.id),
    /** Main category (division) of the athlete in this sport: a category set of the sport. */
    primaryCategoryId: uuid().references(() => categorySets.id),
    position: text(),
    fromYear: integer(),
    toYear: integer(),
  },
  (t) => [index().on(t.sportId).where(live(t.deletedAt))],
);

export const athleteMilestones = pgTable(
  'athlete_milestones',
  {
    ...baseColumns(),
    athleteId: uuid().notNull().references(() => athletes.id),
    calendarDayId: uuid().notNull().references(() => calendarDays.id),
    year: integer().notNull(),
    date: date({ mode: 'string' }).notNull(),
    kind: milestoneKindEnum().notNull(),
    achievementId: uuid(),
    sourceLinkId: uuid().references(() => sourceLinks.id),
  },
  (t) => [index().on(t.calendarDayId).where(live(t.deletedAt))],
);
export const athleteMilestoneTranslations = pgTable(
  'athlete_milestone_translations',
  { ...baseColumns(), milestoneId: uuid().notNull().references(() => athleteMilestones.id), locale: text().notNull(), title: text().notNull() },
  (t) => [uniqueIndex().on(t.milestoneId, t.locale).where(live(t.deletedAt))],
);

export const athleteTierHistory = pgTable('athlete_tier_history', {
  ...baseColumns(),
  athleteId: uuid().notNull().references(() => athletes.id),
  fromTierId: uuid().notNull().references(() => championTiers.id),
  toTierId: uuid().notNull().references(() => championTiers.id),
  reason: text().notNull(),
  decidedAt: date({ mode: 'string' }).notNull(),
});
