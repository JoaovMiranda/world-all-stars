// AI as an optional, provider-agnostic layer (handoff v3 §7.2, D03/D05): models, prompt versions and every call.
import { index, integer, jsonb, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { aiInvocationStatusEnum } from '../columns/pg-enum.column';

export const aiModels = pgTable(
  'ai_models',
  {
    ...baseColumns(),
    provider: text().notNull(),
    name: text().notNull(),
    version: text().notNull().default(''),
    /** USD per 1k tokens (0 for local models; kept to compare providers). */
    costPer1kIn: real().notNull().default(0),
    costPer1kOut: real().notNull().default(0),
  },
  (t) => [uniqueIndex().on(t.provider, t.name, t.version).where(live(t.deletedAt))],
);

export const promptVersions = pgTable(
  'prompt_versions',
  { ...baseColumns(), task: text().notNull(), version: text().notNull(), templateHash: text().notNull() },
  (t) => [uniqueIndex().on(t.task, t.version).where(live(t.deletedAt))],
);

export const aiInvocations = pgTable(
  'ai_invocations',
  {
    ...baseColumns(),
    modelId: uuid().notNull().references(() => aiModels.id),
    promptVersionId: uuid().notNull().references(() => promptVersions.id),
    task: text().notNull(),
    inputRef: text().notNull(),
    inputHash: text().notNull(),
    output: jsonb().$type<Record<string, unknown>>(),
    tokensIn: integer().notNull().default(0),
    tokensOut: integer().notNull().default(0),
    latencyMs: integer().notNull().default(0),
    estimatedCost: real().notNull().default(0),
    status: aiInvocationStatusEnum().notNull(),
    error: text(),
    evidence: jsonb().$type<unknown[]>().notNull().default([]),
    /** Validation levels passed (1 schema, 2 literal evidence, 3 support) and the outcome of the human review. */
    validationLevel: integer().notNull().default(0),
    reviewOutcome: text(),
  },
  (t) => [index().on(t.modelId, t.task).where(live(t.deletedAt)), index().on(t.inputHash).where(live(t.deletedAt))],
);
