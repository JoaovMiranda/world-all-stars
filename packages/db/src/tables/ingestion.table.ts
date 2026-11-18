// Ingestion runs and logs (doc 03 "Fontes e coleta") + AI-assisted collection runs (docs 11/18).
import { index, integer, jsonb, pgTable, text, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live, timestamptz } from '../columns/base.column';
import { ingestionRunStatusEnum } from '../columns/pg-enum.column';
import { sourceLinks, sources } from './source.table';

export const ingestionRuns = pgTable('ingestion_runs', {
  ...baseColumns(),
  jobKey: text().notNull(),
  sourceId: uuid().references(() => sources.id),
  mode: text().notNull(),
  startedAt: timestamptz().notNull(),
  finishedAt: timestamptz(),
  status: ingestionRunStatusEnum().notNull(),
  checked: integer().notNull().default(0),
  unchanged: integer().notNull().default(0),
  updated: integer().notNull().default(0),
  errors: integer().notNull().default(0),
  /** Items skipped per gate (unchanged, noise, parser, duplicate, budget). */
  skipped: jsonb().$type<Record<string, number>>(),
  tokens: integer().notNull().default(0),
  parserVersion: text(),
},
// Admin list (newest first) and "run now" (last run of a job).
(t) => [index().on(t.startedAt).where(live(t.deletedAt)), index().on(t.jobKey, t.startedAt).where(live(t.deletedAt))]);

export const ingestionLogs = pgTable('ingestion_logs', {
  ...baseColumns(),
  runId: uuid().notNull().references(() => ingestionRuns.id),
  sourceLinkId: uuid().references(() => sourceLinks.id),
  level: text().notNull(),
  action: text(),
  message: text().notNull(),
  at: timestamptz().notNull(),
  durationMs: integer(),
},
// Logs of one run, in order.
(t) => [index().on(t.runId, t.at).where(live(t.deletedAt))]);

/** One run of the AI-assisted collection: sources per gate, facts accepted/rejected, extractor tokens. */
export const aiCollectionRuns = pgTable('ai_collection_runs', {
  ...baseColumns(),
  startedAt: timestamptz().notNull(),
  mode: text().notNull(),
  checked: integer().notNull().default(0),
  unchanged: integer().notNull().default(0),
  validated: integer().notNull().default(0),
  factsAccepted: integer().notNull().default(0),
  factsRejected: integer().notNull().default(0),
  extractorTokens: integer().notNull().default(0),
});
