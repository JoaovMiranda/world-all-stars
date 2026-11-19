// Licenses, source authority per information kind, versioned documents, deduplicated payloads and parser
// observations (handoff v3 §5.1–§5.4). Reproducible ingestion: every canonical value points to an observation of a
// document revision fetched under a license, through a SoT rule.
import { index, integer, jsonb, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live, timestamptz } from '../columns/base.column';
import { informationKindEnum } from '../columns/pg-enum.column';
import { competitions } from './competition.table';
import { domainValues } from './domain.table';
import { organizations } from './organization.table';
import { entityRegistry } from './registry.table';
import { sources } from './source.table';
import { sports } from './sport.table';
import { categorySets, metricDefinitions } from './taxonomy.table';

export const licenses = pgTable(
  'licenses',
  {
    ...baseColumns(),
    slug: text().notNull(),
    name: text().notNull(),
    url: text(),
    requiresAttribution: integer().notNull().default(1),
    shareAlike: integer().notNull().default(0),
    commercialUse: integer().notNull().default(1),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);

/** Which source is the SoT for which information, in which scope (most specific rule wins, then priority). */
export const sourceAuthorities = pgTable(
  'source_authorities',
  {
    ...baseColumns(),
    sourceId: uuid().notNull().references(() => sources.id),
    informationKind: informationKindEnum().notNull(),
    sportId: uuid().references(() => sports.id),
    organizationId: uuid().references(() => organizations.id),
    competitionId: uuid().references(() => competitions.id),
    categorySetId: uuid().references(() => categorySets.id),
    metricId: uuid().references(() => metricDefinitions.id),
    recognitionKindId: uuid().references(() => domainValues.id),
    jurisdictionEntityId: uuid().references(() => entityRegistry.id),
    evidenceTypeId: uuid().references(() => domainValues.id),
    validFromYear: integer(),
    validToYear: integer(),
    /** Lower = more authority. */
    priority: integer().notNull().default(100),
    justification: text().notNull(),
    reviewedBy: uuid(),
    reviewedAt: timestamptz(),
  },
  (t) => [index().on(t.informationKind).where(live(t.deletedAt))],
);

/** Content, deduplicated by normalized hash; the body is kept only when the source's retention policy allows. */
export const sourcePayloads = pgTable(
  'source_payloads',
  {
    ...baseColumns(),
    normalizedHash: text().notNull(),
    contentType: text().notNull(),
    /** gzip+base64 of the normalized text (full payload) or of the evidence excerpts only; null = metadata only. */
    body: text(),
    bodyKind: text().notNull().default('none'),
    bytes: integer().notNull().default(0),
  },
  (t) => [uniqueIndex().on(t.normalizedHash).where(live(t.deletedAt))],
);

/** One fetched document: canonical URL × revision × content hash (B04). URLs with identical content share a payload. */
export const sourceDocuments = pgTable(
  'source_documents',
  {
    ...baseColumns(),
    sourceId: uuid().notNull().references(() => sources.id),
    url: text().notNull(),
    canonicalUrl: text().notNull(),
    /** Wikipedia revid, Wikidata lastrevid, Git commit SHA… null when the source has none. */
    revisionId: text(),
    fetchedAt: timestamptz().notNull(),
    lastSeenAt: timestamptz().notNull(),
    httpStatus: integer().notNull(),
    contentType: text(),
    charset: text(),
    rawHash: text().notNull(),
    normalizedHash: text().notNull(),
    payloadId: uuid().references(() => sourcePayloads.id),
    licenseId: uuid(),
    jobId: uuid(),
  },
  (t) => [uniqueIndex().on(t.canonicalUrl, t.revisionId, t.normalizedHash).where(live(t.deletedAt)), index().on(t.sourceId).where(live(t.deletedAt))],
);

/** What a parser (versioned) extracted from a document, in a general ingestion contract (validated by Zod). */
export const sourceObservations = pgTable(
  'source_observations',
  {
    ...baseColumns(),
    documentId: uuid().notNull().references(() => sourceDocuments.id),
    providerKey: text().notNull(),
    parserKey: text().notNull(),
    parserVersion: text().notNull(),
    recordKey: text().notNull(),
    informationKind: informationKindEnum().notNull(),
    /** Contract name + version, e.g. `entry@1`. */
    contract: text().notNull(),
    extracted: jsonb().$type<Record<string, unknown>>().notNull(),
    observedAt: timestamptz().notNull(),
    confidence: real().notNull().default(1),
    /** Resolved entity (identity step), when known. */
    entityId: uuid().references(() => entityRegistry.id),
  },
  (t) => [uniqueIndex().on(t.documentId, t.parserKey, t.parserVersion, t.recordKey).where(live(t.deletedAt)), index().on(t.entityId).where(live(t.deletedAt))],
);

/** Identity review queue (§7.1): an observation whose competitor could not be matched automatically. */
export const identityCandidates = pgTable(
  'identity_candidates',
  {
    ...baseColumns(),
    observationId: uuid().notNull().references(() => sourceObservations.id),
    discoveredName: text().notNull(),
    proposedEntityId: uuid().references(() => entityRegistry.id),
    confidence: real().notNull(),
    evidence: jsonb().$type<Record<string, unknown>>().notNull().default({}),
    /** pending · matched · created · duplicate · rejected */
    status: text().notNull().default('pending'),
    decidedBy: uuid(),
    decidedAt: timestamptz(),
  },
  (t) => [uniqueIndex().on(t.observationId).where(live(t.deletedAt)), index().on(t.status).where(live(t.deletedAt))],
);
