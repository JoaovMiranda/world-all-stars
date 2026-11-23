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
    wikidataQid: text(),
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
    uniqueIndex().on(t.wikidataQid).where(live(t.deletedAt)),
    index().on(t.birthCalendarDayId).where(live(t.deletedAt)),
    index().on(t.deathCalendarDayId).where(live(t.deletedAt)),
  ],
);
export const athleteTranslations = pgTable(
  'athlete_translations',
  { ...baseColumns(), athleteId: uuid().notNull().references(() => athletes.id), locale: text().notNull(), shortBio: text() },
  (t) => [uniqueIndex().on(t.athleteId, t.locale).where(live(t.deletedAt))],
);

/** LEGACY (read-only): lives on as competitor_representations; dropped once no module references it (handoff T1.2). */
export const athleteNationalities = pgTable(
  'athlete_nationalities',
  { ...baseColumns(), athleteId: uuid().notNull().references(() => athletes.id), countryId: uuid().notNull().references(() => countries.id), isPrimary: boolean().notNull().default(false) },
  (t) => [index().on(t.countryId).where(live(t.deletedAt))],
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

/** LEGACY (read-only): lives on as competitor_memberships; dropped once no module references it (handoff T1.2). */
export const athleteTeams = pgTable('athlete_teams', {
  ...baseColumns(),
  athleteId: uuid().notNull().references(() => athletes.id),
  teamId: uuid().notNull().references(() => teams.id),
  fromDate: date({ mode: 'string' }),
  toDate: date({ mode: 'string' }),
  fromYear: integer(),
  toYear: integer(),
  role: text(),
});

/**
 * LEGACY (read-only, never read by the catalog): a title, medal, placing or award. Its rows live on as recognition
 * grants (`recognition_grants`); dropped once no module references it (handoff T1.2). Its sport category and award
 * edition ids point to tables already dropped (category sets / recognition cycles took their place).
 */
export const achievements = pgTable(
  'achievements',
  {
    ...baseColumns(),
    athleteId: uuid().notNull().references(() => athletes.id),
    teamId: uuid().references(() => teams.id),
    sportId: uuid().references(() => sports.id),
    sportCategoryId: uuid(),
    achievementTypeId: uuid().notNull().references(() => achievementTypes.id),
    competitionEditionId: uuid().references(() => competitionEditions.id),
    awardEditionId: uuid(),
    calendarDayId: uuid().references(() => calendarDays.id),
    year: integer().notNull(),
    rank: integer(),
    sourceLinkId: uuid().references(() => sourceLinks.id),
  },
  (t) => [index().on(t.athleteId, t.year).where(live(t.deletedAt)), index().on(t.calendarDayId).where(live(t.deletedAt))],
);

/** LEGACY (read-only): lives on as title_holdings; dropped once no module references it (handoff T1.2). */
export const titleReigns = pgTable('title_reigns', {
  ...baseColumns(),
  athleteId: uuid().notNull().references(() => athletes.id),
  competitionId: uuid().notNull().references(() => competitions.id),
  wonCalendarDayId: uuid().references(() => calendarDays.id),
  wonYear: integer(),
  wonDate: date({ mode: 'string' }).notNull(),
  lostCalendarDayId: uuid().references(() => calendarDays.id),
  lostYear: integer(),
  lostDate: date({ mode: 'string' }),
  endReason: text(),
  defenses: integer(),
  sourceLinkId: uuid().references(() => sourceLinks.id),
});

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

/** LEGACY (read-only): lives on as competitor_stat_extensions + snapshots; dropped once no module references it (handoff T1.2). */
export const athleteStats = pgTable('athlete_stats', {
  ...baseColumns(),
  athleteId: uuid().notNull().references(() => athletes.id),
  sportId: uuid().references(() => sports.id),
  period: text().notNull().default('career'),
  statsSchemaKey: text().notNull(),
  stats: jsonb().$type<Record<string, unknown>>().notNull(),
});

export const athleteTierHistory = pgTable('athlete_tier_history', {
  ...baseColumns(),
  athleteId: uuid().notNull().references(() => athletes.id),
  fromTierId: uuid().notNull().references(() => championTiers.id),
  toTierId: uuid().notNull().references(() => championTiers.id),
  reason: text().notNull(),
  decidedAt: date({ mode: 'string' }).notNull(),
});
