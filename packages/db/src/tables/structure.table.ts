// Competitive structure and results (handoff v3 §4.3–§4.4): stages, events, contests, classifications, entries,
// members, participations, results and their metrics. Sport specifics only via registered extensions.
import { type AnyPgColumn, boolean, date, index, integer, jsonb, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { competitionEditions } from './competition.table';
import { domainValues } from './domain.table';
import { calendarDays, cities } from './geography.table';
import { competitors, entityRegistry } from './registry.table';
import { sports } from './sport.table';
import { categorySets, competitionRulesets, extensionSchemas, metricDefinitions } from './taxonomy.table';

export const competitionStages = pgTable(
  'competition_stages',
  {
    ...baseColumns(),
    editionId: uuid().notNull().references(() => competitionEditions.id),
    parentStageId: uuid().references((): AnyPgColumn => competitionStages.id),
    stageKindId: uuid().notNull().references(() => domainValues.id),
    label: text().notNull(),
    sortOrder: integer().notNull().default(0),
    startDate: date({ mode: 'string' }),
    endDate: date({ mode: 'string' }),
    cityId: uuid().references(() => cities.id),
  },
  (t) => [uniqueIndex().on(t.editionId, t.label).where(live(t.deletedAt))],
);

/** A race, match tournament, bout division, game… of an edition: format + composition + categories + ruleset. */
export const competitionEvents = pgTable(
  'competition_events',
  {
    ...baseColumns(),
    editionId: uuid().notNull().references(() => competitionEditions.id),
    stageId: uuid().references(() => competitionStages.id),
    sportId: uuid().notNull().references(() => sports.id),
    formatId: uuid().notNull().references(() => domainValues.id),
    compositionId: uuid().notNull().references(() => domainValues.id),
    categorySetId: uuid().references(() => categorySets.id),
    rulesetId: uuid().references(() => competitionRulesets.id),
    label: text().notNull(),
  },
  (t) => [uniqueIndex().on(t.editionId, t.label).where(live(t.deletedAt)), index().on(t.sportId).where(live(t.deletedAt))],
);

/** One confrontation: match, bout, game, heat, round of a race. */
export const contests = pgTable(
  'contests',
  {
    ...baseColumns(),
    eventId: uuid().notNull().references(() => competitionEvents.id),
    stageId: uuid().references(() => competitionStages.id),
    label: text().notNull(),
    sequence: integer().notNull().default(0),
    date: date({ mode: 'string' }),
    calendarDayId: uuid().references(() => calendarDays.id),
    cityId: uuid().references(() => cities.id),
  },
  (t) => [uniqueIndex().on(t.eventId, t.label).where(live(t.deletedAt))],
);

/** Accumulated standings (league table, circuit points, overall): rows are competition_results with scope classification. */
export const classifications = pgTable(
  'classifications',
  {
    ...baseColumns(),
    editionId: uuid().notNull().references(() => competitionEditions.id),
    stageId: uuid().references(() => competitionStages.id),
    eventId: uuid().references(() => competitionEvents.id),
    kindId: uuid().notNull().references(() => domainValues.id),
    label: text().notNull(),
    computedBySource: boolean().notNull().default(true),
  },
  (t) => [uniqueIndex().on(t.editionId, t.label).where(live(t.deletedAt))],
);

/** A competitor (person, team or group) entered in an event (or edition), representing someone. */
export const competitionEntries = pgTable(
  'competition_entries',
  {
    ...baseColumns(),
    editionId: uuid().notNull().references(() => competitionEditions.id),
    eventId: uuid().references(() => competitionEvents.id),
    competitorId: uuid().notNull().references(() => competitors.id),
    representationId: uuid().references(() => entityRegistry.id),
    statusId: uuid().notNull().references(() => domainValues.id),
    seed: integer(),
    bib: text(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.editionId, t.eventId, t.competitorId).where(live(t.deletedAt)), index().on(t.competitorId).where(live(t.deletedAt))],
);

/** People inside an entry (squad, roster, pair, relay legs) with sport/format-specific roles. */
export const entryMembers = pgTable(
  'entry_members',
  {
    ...baseColumns(),
    entryId: uuid().notNull().references(() => competitionEntries.id),
    personId: uuid().notNull().references(() => competitors.id),
    roleId: uuid().references(() => domainValues.id),
    registrationStatusId: uuid().notNull().references(() => domainValues.id),
    appearanceId: uuid().notNull().references(() => domainValues.id),
    positionId: uuid().references(() => domainValues.id),
    shirtNumber: integer(),
    /** verified / provisional / disputed / rejected (a ranking only counts verified). */
    verification: text().notNull().default('provisional'),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.entryId, t.personId).where(live(t.deletedAt)), index().on(t.personId).where(live(t.deletedAt))],
);

/** The sides of a contest (entry + outcome: win, loss, draw, no contest…). */
export const contestSides = pgTable(
  'contest_sides',
  { ...baseColumns(), contestId: uuid().notNull().references(() => contests.id), entryId: uuid().notNull().references(() => competitionEntries.id), side: integer().notNull(), outcomeId: uuid().references(() => domainValues.id) },
  (t) => [uniqueIndex().on(t.contestId, t.entryId).where(live(t.deletedAt))],
);

/** Who took part in a given contest and how (starter in the final, leg 3 of the relay…). Only when documented. */
export const contestParticipations = pgTable(
  'contest_participations',
  {
    ...baseColumns(),
    contestId: uuid().notNull().references(() => contests.id),
    entryId: uuid().notNull().references(() => competitionEntries.id),
    personId: uuid().notNull().references(() => competitors.id),
    roleId: uuid().notNull().references(() => domainValues.id),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.contestId, t.personId).where(live(t.deletedAt))],
);

/** Result of an entry in an event, a contest or a classification: small core + metrics + typed extension. */
export const competitionResults = pgTable(
  'competition_results',
  {
    ...baseColumns(),
    /** 'event' | 'contest' | 'classification' */
    scope: text().notNull(),
    scopeId: uuid().notNull(),
    entryId: uuid().notNull().references(() => competitionEntries.id),
    rank: integer(),
    rankTied: boolean().notNull().default(false),
    statusId: uuid().notNull().references(() => domainValues.id),
    extensionSchemaId: uuid().references(() => extensionSchemas.id),
    extension: jsonb().$type<Record<string, unknown>>(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.scope, t.scopeId, t.entryId).where(live(t.deletedAt)), index().on(t.entryId).where(live(t.deletedAt))],
);

export const resultMetrics = pgTable(
  'result_metrics',
  {
    ...baseColumns(),
    resultId: uuid().notNull().references(() => competitionResults.id),
    metricId: uuid().notNull().references(() => metricDefinitions.id),
    valueNumeric: real(),
    valueText: text(),
    unitOriginal: text(),
    /** Exactly as the source wrote it ("9.58", "2:01:09", "1–0 a.e.t."). */
    valueOriginal: text().notNull(),
  },
  (t) => [uniqueIndex().on(t.resultId, t.metricId).where(live(t.deletedAt))],
);

/** Career/season statistics of a competitor as defined metrics (replaces the free JSON of athlete_stats). */
export const competitorStatSnapshots = pgTable(
  'competitor_stat_snapshots',
  {
    ...baseColumns(),
    competitorId: uuid().notNull().references(() => competitors.id),
    sportId: uuid().references(() => sports.id),
    periodId: uuid().notNull().references(() => domainValues.id),
    periodLabel: text().notNull().default('career'),
    metricId: uuid().notNull().references(() => metricDefinitions.id),
    valueNumeric: real(),
    valueText: text(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.competitorId, t.sportId, t.periodLabel, t.metricId).where(live(t.deletedAt))],
);

/**
 * Key prefix of the registered extension schemas that carry a competitor's sport statistics document
 * (`athlete-stats.<sport stats schema key>`): the catalog strips it to get the schema key of the profile panel.
 */
export const ATHLETE_STATS_EXTENSION_PREFIX = 'athlete-stats.';

/**
 * Sport-specific statistics of a competitor that are not flat metrics (per-edition tables, records, presentation
 * hints), validated by a registered extension schema (`athlete-stats.<sport schema>`). Flat numeric values also go to
 * competitor_stat_snapshots.
 */
export const competitorStatExtensions = pgTable(
  'competitor_stat_extensions',
  {
    ...baseColumns(),
    competitorId: uuid().notNull().references(() => competitors.id),
    sportId: uuid().references(() => sports.id),
    periodLabel: text().notNull().default('career'),
    extensionSchemaId: uuid().notNull().references(() => extensionSchemas.id),
    data: jsonb().$type<Record<string, unknown>>().notNull(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.competitorId, t.periodLabel, t.extensionSchemaId).where(live(t.deletedAt))],
);
