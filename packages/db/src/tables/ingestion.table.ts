// Ingestion runs and logs (doc 03 "Sources and collection") + AI-assisted collection runs (docs 11/18).
import { index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live, timestamptz } from '../columns/base.column';
import { ingestionRunStatusEnum, jobItemStatusEnum } from '../columns/pg-enum.column';
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
  /** Handoff v3 §6.3: the run IS the job (no extra table). Same params_hash = same job (idempotent enqueue). */
  params: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  paramsHash: text(),
  priority: integer().notNull().default(100),
  cancelRequestedAt: timestamptz(),
  checkpoint: jsonb().$type<Record<string, unknown>>(),
  requestedBy: uuid(),
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
  itemId: uuid(),
  stage: text(),
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

/** One unit of work of a job (A02): claimed with FOR UPDATE SKIP LOCKED, retried with backoff, dead-lettered. */
export const ingestionJobItems = pgTable(
  'ingestion_job_items',
  {
    ...baseColumns(),
    runId: uuid().notNull().references(() => ingestionRuns.id),
    itemKey: text().notNull(),
    status: jobItemStatusEnum().notNull().default('pending'),
    attempts: integer().notNull().default(0),
    maxAttempts: integer().notNull().default(5),
    nextAttemptAt: timestamptz().notNull().defaultNow(),
    lockedBy: text(),
    lockedUntil: timestamptz(),
    lastError: text(),
    payload: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    checkpoint: jsonb().$type<Record<string, unknown>>(),
    finishedAt: timestamptz(),
  },
  (t) => [uniqueIndex().on(t.runId, t.itemKey).where(live(t.deletedAt)), index('ingestion_job_items_claim_idx').on(t.status, t.nextAttemptAt).where(live(t.deletedAt))],
);
