// Source registry, collected links, per-field provenance, conflicts, AI extraction queue and media (doc 03/11/18).
import { sql } from 'drizzle-orm';
import { boolean, date, index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live, timestamptz } from '../columns/base.column';
import { sourceOriginKindEnum, sourceUsageStatusEnum } from '../columns/pg-enum.column';

export const sources = pgTable(
  'sources',
  {
    ...baseColumns(),
    slug: text().notNull(),
    name: text().notNull(),
    baseUrl: text().notNull(),
    license: text().notNull().default(''),
    originKind: sourceOriginKindEnum().notNull(),
    commercialUse: text().notNull(),
    usageStatus: sourceUsageStatusEnum().notNull(),
    usageNote: text(),
    licenseReviewedAt: timestamptz(),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);

/**
 * A link collected (or queued for collection) for an entity. `entity_id` null + `pending_label` = link waiting for
 * the next collection (admin or approved suggestion, doc 21); the collector fills the entity later.
 */
export const sourceLinks = pgTable(
  'source_links',
  {
    ...baseColumns(),
    entityType: text().notNull(),
    entityId: uuid(),
    url: text().notNull(),
    sourceId: uuid().references(() => sources.id),
    parserKey: text(),
    /** 'system' | 'suggestion' | 'admin' */
    origin: text().notNull().default('system'),
    suggestionId: uuid(),
    pendingLabel: text(),
    pendingSport: text(),
    isActive: boolean().notNull().default(true),
    lastRevision: text(),
    lastSectionHashes: jsonb().$type<Record<string, string>>(),
    lastCheckedAt: date({ mode: 'string' }),
    lastStatus: text(),
  },
  (t) => [
    index().on(t.entityType, t.entityId).where(live(t.deletedAt)),
    index().on(t.sourceId).where(live(t.deletedAt)),
    // Links queued for the next collection (entity not known yet), newest first.
    index('source_links_queued_idx').on(t.createdAt).where(sql`${t.deletedAt} is null and ${t.entityId} is null`),
  ],
);

/** Origin of one field of an entity (Sources tab, ⓘ per field). */
export const fieldProvenance = pgTable(
  'field_provenance',
  {
    ...baseColumns(),
    entityType: text().notNull(),
    entityId: uuid().notNull(),
    fieldName: text().notNull(),
    sourceLinkId: uuid().references(() => sourceLinks.id),
    ref: text(),
    retrievedAt: date({ mode: 'string' }),
    /** 'parser' | 'manual' | 'ai' */
    extractionMethod: text().notNull().default('parser'),
    model: text(),
    evidenceQuote: text(),
  },
  (t) => [index().on(t.entityType, t.entityId).where(live(t.deletedAt))],
);

/** Two sources disagree on a field; the admin decides (A1). */
export const fieldConflicts = pgTable('field_conflicts', {
  ...baseColumns(),
  entityType: text().notNull(),
  entityId: uuid().notNull(),
  fieldName: text().notNull(),
  chosenSourceLinkId: uuid().references(() => sourceLinks.id),
  otherSourceLinkId: uuid().references(() => sourceLinks.id),
  /** Value when the conflict was opened (3-way diff base). */
  baseValue: text(),
  chosenValue: text().notNull(),
  otherValue: text().notNull(),
  /** 'pending' | 'approved' | 'rejected' */
  resolution: text().notNull().default('pending'),
  reviewNote: text(),
  reviewedBy: uuid(),
  reviewedAt: timestamptz(),
});

/** Sections sent (or skipped at a gate) to the local AI extractor (doc 11). */
export const aiExtractionQueue = pgTable(
  'ai_extraction_queue',
  {
    ...baseColumns(),
    sourceLinkId: uuid().notNull().references(() => sourceLinks.id),
    revision: text(),
    sectionKey: text().notNull(),
    sectionHash: text().notNull(),
    diffText: text(),
    /** 'pending' | 'approved' | 'rejected' | 'skipped' */
    status: text().notNull().default('pending'),
    skippedAtGate: text(),
    resultJson: jsonb(),
    model: text(),
    promptVersion: text(),
    tokensIn: integer().notNull().default(0),
    tokensOut: integer().notNull().default(0),
    attempts: integer().notNull().default(0),
    error: text(),
    reviewNote: text(),
    reviewedBy: uuid(),
    reviewedAt: timestamptz(),
  },
  (t) => [uniqueIndex().on(t.sourceLinkId, t.sectionHash).where(live(t.deletedAt)), index().on(t.createdAt).where(live(t.deletedAt))],
);

/** Image by link only (Commons): nothing stored (doc 00). */
export const mediaLinks = pgTable('media_links', {
  ...baseColumns(),
  url: text().notNull(),
  thumbUrl: text(),
  filePageUrl: text(),
  kind: text().notNull().default('photo'),
  author: text(),
  license: text(),
  year: integer(),
  status: text().notNull().default('ok'),
  lastVerifiedAt: date({ mode: 'string' }),
  sourceId: uuid().references(() => sources.id),
});
