// Versioning and audit (doc 03): written ONLY by the BaseRepository, in the same transaction as the change.
import { index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';

/** Full row after each change + JSON Patch against the previous version (restore = copy a snapshot as a new version). */
export const entityVersions = pgTable(
  'entity_versions',
  {
    ...baseColumns(),
    entityType: text().notNull(),
    entityId: uuid().notNull(),
    versionNumber: integer().notNull(),
    snapshot: jsonb().$type<Record<string, unknown>>(),
    diff: jsonb().$type<unknown[]>(),
    summary: text(),
    author: text(),
    reason: text(),
    changeRequestId: uuid(),
    ingestionRunId: uuid(),
  },
  (t) => [uniqueIndex().on(t.entityType, t.entityId, t.versionNumber).where(live(t.deletedAt))],
);

/** Who did what: every repository write ('create' | 'update' | 'soft_delete' | 'restore') + admin decisions. */
export const auditLogs = pgTable(
  'audit_logs',
  {
    ...baseColumns(),
    actorId: uuid(),
    /** 'user' | 'system' */
    actorType: text().notNull(),
    action: text().notNull(),
    entityType: text(),
    entityId: uuid(),
    entityVersion: integer(),
    ipHash: text(),
    userAgent: text(),
    /** Admin decisions: { target, reason }. */
    metadata: jsonb().$type<Record<string, unknown>>().notNull().default({}),
  },
  (t) => [index().on(t.action).where(live(t.deletedAt)), index().on(t.entityType, t.entityId).where(live(t.deletedAt)), index().on(t.createdAt).where(live(t.deletedAt))],
);
