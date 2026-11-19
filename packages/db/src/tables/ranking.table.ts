// Universal ranking engine storage (handoff v3 §8): methodology → ruleset → calculation run → snapshot → entries.
// Nothing sport-specific; published snapshots are immutable (trigger in the migration).
import { boolean, index, integer, jsonb, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live, timestamptz } from '../columns/base.column';
import { rankingOutputKindEnum, rankingSnapshotStatusEnum } from '../columns/pg-enum.column';
import { competitors } from './registry.table';
import { sports } from './sport.table';

export const rankingMethodologies = pgTable(
  'ranking_methodologies',
  { ...baseColumns(), key: text().notNull(), sportId: uuid().references(() => sports.id), outputKind: rankingOutputKindEnum().notNull(), status: text().notNull().default('active'), name: text().notNull() },
  (t) => [uniqueIndex().on(t.key).where(live(t.deletedAt))],
);

/** Immutable once activated: a change is a new version. */
export const rankingRulesets = pgTable(
  'ranking_rulesets',
  {
    ...baseColumns(),
    methodologyId: uuid().notNull().references(() => rankingMethodologies.id),
    version: text().notNull(),
    config: jsonb().$type<Record<string, unknown>>().notNull(),
    configHash: text().notNull(),
    activatedAt: timestamptz(),
  },
  (t) => [uniqueIndex().on(t.methodologyId, t.version).where(live(t.deletedAt))],
);

export const rankingCalculationRuns = pgTable(
  'ranking_calculation_runs',
  {
    ...baseColumns(),
    methodologyId: uuid().notNull().references(() => rankingMethodologies.id),
    rulesetId: uuid().notNull().references(() => rankingRulesets.id),
    algorithmVersion: text().notNull(),
    methodologyVersion: text().notNull(),
    rankingKey: text().notNull(),
    scope: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    params: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    /** Ids AND versions of every input (results, grants, holdings, squad memberships) — reproducibility (E02). */
    inputManifest: jsonb().$type<unknown[]>().notNull(),
    inputHash: text().notNull(),
    outputHash: text(),
    status: text().notNull(),
    error: text(),
    startedAt: timestamptz().notNull(),
    finishedAt: timestamptz(),
  },
  (t) => [index().on(t.rankingKey, t.startedAt).where(live(t.deletedAt))],
);

export const rankingSnapshots = pgTable(
  'ranking_snapshots',
  {
    ...baseColumns(),
    runId: uuid().notNull().references(() => rankingCalculationRuns.id),
    rankingKey: text().notNull(),
    title: text().notNull(),
    status: rankingSnapshotStatusEnum().notNull().default('calculated'),
    inputHash: text().notNull(),
    outputHash: text().notNull(),
    publishedAt: timestamptz(),
    approvalsRequired: integer().notNull().default(2),
    approvalsCount: integer().notNull().default(0),
  },
  (t) => [index().on(t.rankingKey, t.status).where(live(t.deletedAt))],
);

export const rankingSnapshotApprovals = pgTable(
  'ranking_snapshot_approvals',
  { ...baseColumns(), snapshotId: uuid().notNull().references(() => rankingSnapshots.id), adminUserId: uuid().notNull(), reason: text() },
  (t) => [uniqueIndex().on(t.snapshotId, t.adminUserId).where(live(t.deletedAt))],
);

export const rankingEntries = pgTable(
  'ranking_entries',
  {
    ...baseColumns(),
    snapshotId: uuid().notNull().references(() => rankingSnapshots.id),
    competitorId: uuid().notNull().references(() => competitors.id),
    rank: integer(),
    rankTied: boolean().notNull().default(false),
    band: text(),
    score: real(),
    eligible: boolean().notNull().default(true),
    eligibilityReason: text(),
  },
  (t) => [uniqueIndex().on(t.snapshotId, t.competitorId).where(live(t.deletedAt)), index().on(t.competitorId).where(live(t.deletedAt))],
);

export const rankingEntryMetrics = pgTable(
  'ranking_entry_metrics',
  { ...baseColumns(), entryId: uuid().notNull().references(() => rankingEntries.id), metric: text().notNull(), value: real(), display: text() },
  (t) => [uniqueIndex().on(t.entryId, t.metric).where(live(t.deletedAt))],
);

/** How much each piece of evidence contributed (explainability). */
export const rankingEntryItems = pgTable(
  'ranking_entry_items',
  { ...baseColumns(), entryId: uuid().notNull().references(() => rankingEntries.id), evidenceType: text().notNull(), evidenceId: uuid().notNull(), contribution: real().notNull(), note: text() },
  (t) => [index().on(t.entryId).where(live(t.deletedAt))],
);
