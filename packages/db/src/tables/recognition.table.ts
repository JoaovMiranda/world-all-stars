// Recognitions (handoff v3 §4.5): definition × grant. Titles, medals, awards, belts, records, hall of fame and
// traditional honours share one model; title holdings and record marks keep their own history.
import { boolean, date, index, integer, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { competitions } from './competition.table';
import { domainValues } from './domain.table';
import { calendarDays, cities } from './geography.table';
import { organizations } from './organization.table';
import { competitors } from './registry.table';
import { sports } from './sport.table';
import { competitionResults, contests } from './structure.table';
import { categorySets, metricDefinitions } from './taxonomy.table';

export const recognitionDefinitions = pgTable(
  'recognition_definitions',
  {
    ...baseColumns(),
    slug: text().notNull(),
    kindId: uuid().notNull().references(() => domainValues.id),
    issuerOrgId: uuid().references(() => organizations.id),
    sportId: uuid().references(() => sports.id),
    competitionId: uuid().references(() => competitions.id),
    categorySetId: uuid().references(() => categorySets.id),
    /** Record definitions: what is measured. */
    metricId: uuid().references(() => metricDefinitions.id),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt)), index().on(t.competitionId).where(live(t.deletedAt))],
);
export const recognitionDefinitionTranslations = pgTable(
  'recognition_definition_translations',
  { ...baseColumns(), definitionId: uuid().notNull().references(() => recognitionDefinitions.id), locale: text().notNull(), name: text().notNull(), criteria: text() },
  (t) => [uniqueIndex().on(t.definitionId, t.locale).where(live(t.deletedAt))],
);

/** A cycle of concession (yearly award, edition of a hall of fame): optional. */
export const recognitionCycles = pgTable(
  'recognition_cycles',
  { ...baseColumns(), definitionId: uuid().notNull().references(() => recognitionDefinitions.id), year: integer(), label: text().notNull(), calendarDayId: uuid().references(() => calendarDays.id) },
  (t) => [uniqueIndex().on(t.definitionId, t.label).where(live(t.deletedAt))],
);

/** One concession to a competitor (may derive from a result; may be shared, revoked or retroactive). */
export const recognitionGrants = pgTable(
  'recognition_grants',
  {
    ...baseColumns(),
    definitionId: uuid().notNull().references(() => recognitionDefinitions.id),
    cycleId: uuid().references(() => recognitionCycles.id),
    competitorId: uuid().notNull().references(() => competitors.id),
    /** Team/group through which a person earned it (member of the champion squad). */
    viaCompetitorId: uuid().references(() => competitors.id),
    resultId: uuid().references(() => competitionResults.id),
    levelId: uuid().references(() => domainValues.id),
    rank: integer(),
    year: integer(),
    date: date({ mode: 'string' }),
    calendarDayId: uuid().references(() => calendarDays.id),
    shared: boolean().notNull().default(false),
    statusId: uuid().notNull().references(() => domainValues.id),
    sourceLinkId: uuid(),
  },
  (t) => [
    // Not unique: level/result/year may be null (Postgres NULLs are distinct); writers key grants by a deterministic id.
    index().on(t.definitionId, t.competitorId).where(live(t.deletedAt)),
    index().on(t.competitorId, t.year).where(live(t.deletedAt)),
    index().on(t.calendarDayId).where(live(t.deletedAt)),
  ],
);

/** Holding of a title over time (belts): defenses are contests (replaces title_reigns). */
export const titleHoldings = pgTable(
  'title_holdings',
  {
    ...baseColumns(),
    definitionId: uuid().notNull().references(() => recognitionDefinitions.id),
    competitorId: uuid().notNull().references(() => competitors.id),
    wonContestId: uuid().references(() => contests.id),
    fromDate: date({ mode: 'string' }).notNull(),
    fromYear: integer(),
    fromCalendarDayId: uuid().references(() => calendarDays.id),
    toDate: date({ mode: 'string' }),
    toYear: integer(),
    toCalendarDayId: uuid().references(() => calendarDays.id),
    endReasonId: uuid().references(() => domainValues.id),
    defenses: integer(),
    sourceLinkId: uuid(),
  },
  (t) => [index().on(t.competitorId).where(live(t.deletedAt))],
);
export const titleDefenses = pgTable(
  'title_defenses',
  { ...baseColumns(), holdingId: uuid().notNull().references(() => titleHoldings.id), contestId: uuid().notNull().references(() => contests.id) },
  (t) => [uniqueIndex().on(t.holdingId, t.contestId).where(live(t.deletedAt))],
);

/** A ratified mark of a record definition (value + original unit + conditions + supersession). */
export const recordMarks = pgTable(
  'record_marks',
  {
    ...baseColumns(),
    definitionId: uuid().notNull().references(() => recognitionDefinitions.id),
    competitorId: uuid().notNull().references(() => competitors.id),
    valueNumeric: real(),
    valueOriginal: text().notNull(),
    unitOriginal: text(),
    date: date({ mode: 'string' }),
    cityId: uuid().references(() => cities.id),
    conditions: text(),
    ratificationStatusId: uuid().notNull().references(() => domainValues.id),
    ratifiedByOrgId: uuid().references(() => organizations.id),
    supersededById: uuid(),
    sourceLinkId: uuid(),
  },
  (t) => [index().on(t.definitionId).where(live(t.deletedAt))],
);
