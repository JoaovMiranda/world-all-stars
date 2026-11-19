// Entity registry, competitors and cross-entity identity (handoff v3 §4.1).
// Every catalog entity has ONE row in entity_registry with the SAME id as its own table (filled by triggers, see
// migration 0005): aliases, external ids, provenance, merges, redirects and relations get a real FK.
import { boolean, date, index, integer, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live, timestamptz } from '../columns/base.column';
import { competitorKindEnum, entityTypeEnum, profileVisibilityEnum } from '../columns/pg-enum.column';
import { domainValues } from './domain.table';

export const entityRegistry = pgTable(
  'entity_registry',
  { ...baseColumns(), entityType: entityTypeEnum().notNull() },
  (t) => [index().on(t.entityType).where(live(t.deletedAt))],
);

/** Supertype of everything that receives results and recognitions: person (athletes), team (teams), group. */
export const competitors = pgTable(
  'competitors',
  {
    ...baseColumns(),
    kind: competitorKindEnum().notNull(),
    profileVisibility: profileVisibilityEnum().notNull().default('public'),
    visibilityReason: text(),
    /** Set when merged into another competitor (the merged row is soft-deleted; its slug redirects). */
    mergedIntoId: uuid(),
  },
  (t) => [index().on(t.kind).where(live(t.deletedAt))],
);

/** Pairs, trios, crews, relay teams and ad hoc rosters: a competitor made of people. */
export const competitorGroups = pgTable(
  'competitor_groups',
  {
    ...baseColumns(),
    slug: text().notNull(),
    name: text().notNull(),
    groupKindId: uuid().references(() => domainValues.id),
    /** Event the group was formed for (relay of one race), when it is not a lasting group. */
    formedForEventId: uuid(),
    validFrom: date({ mode: 'string' }),
    validTo: date({ mode: 'string' }),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);

/** Person ↔ team/group over time (generalizes athlete_teams): player of a club, member of a pair or esports org. */
export const competitorMemberships = pgTable(
  'competitor_memberships',
  {
    ...baseColumns(),
    memberId: uuid().notNull().references(() => competitors.id),
    parentId: uuid().notNull().references(() => competitors.id),
    roleId: uuid().references(() => domainValues.id),
    fromDate: date({ mode: 'string' }),
    toDate: date({ mode: 'string' }),
    fromYear: integer(),
    toYear: integer(),
    sourceLinkId: uuid(),
  },
  (t) => [index().on(t.memberId).where(live(t.deletedAt)), index().on(t.parentId).where(live(t.deletedAt))],
);

/** Names of any entity (C03): official, international, original, display, nickname, former, self-designation… */
export const entityAliases = pgTable(
  'entity_aliases',
  {
    ...baseColumns(),
    entityId: uuid().notNull().references(() => entityRegistry.id),
    name: text().notNull(),
    /** Accent-free lowercase form (search and identity). */
    normalized: text().notNull(),
    kindId: uuid().notNull().references(() => domainValues.id),
    locale: text(),
    script: text(),
    validFromYear: integer(),
    validToYear: integer(),
    sourceObservationId: uuid(),
  },
  (t) => [uniqueIndex().on(t.entityId, t.normalized, t.kindId).where(live(t.deletedAt)), index().on(t.normalized).where(live(t.deletedAt))],
);

/** Identifiers in other systems (Wikidata QID, Wikipedia titles, Fjelstul ids…): never the internal identity. */
export const entityExternalIds = pgTable(
  'entity_external_ids',
  {
    ...baseColumns(),
    entityId: uuid().notNull().references(() => entityRegistry.id),
    provider: text().notNull(),
    externalId: text().notNull(),
    url: text(),
    /** A renamed Wikipedia title keeps the old row with is_current = false. */
    isCurrent: boolean().notNull().default(true),
  },
  (t) => [uniqueIndex().on(t.provider, t.externalId).where(live(t.deletedAt)), index().on(t.entityId).where(live(t.deletedAt))],
);

/** Old slug → entity (301): language migration, renames and merges. */
export const slugRedirects = pgTable(
  'slug_redirects',
  { ...baseColumns(), entityType: entityTypeEnum().notNull(), entityId: uuid().notNull().references(() => entityRegistry.id), oldSlug: text().notNull(), scope: text().notNull().default('') },
  (t) => [uniqueIndex().on(t.entityType, t.scope, t.oldSlug).where(live(t.deletedAt))],
);

/** Merge history (D02): what was re-pointed, by whom and why; undone_* when reverted. */
export const entityMerges = pgTable('entity_merges', {
  ...baseColumns(),
  entityType: entityTypeEnum().notNull(),
  survivorId: uuid().notNull().references(() => entityRegistry.id),
  mergedId: uuid().notNull().references(() => entityRegistry.id),
  reason: text().notNull(),
  actorId: uuid(),
  affected: jsonb().$type<Record<string, string[]>>().notNull().default({}),
  mergedAt: timestamptz().notNull(),
  undoneAt: timestamptz(),
  undoneBy: uuid(),
  undoReason: text(),
});

/** Typed relation between two entities: successor_of, part_of, origin_of, succeeded_by… (with period and source). */
export const entityRelations = pgTable(
  'entity_relations',
  {
    ...baseColumns(),
    fromId: uuid().notNull().references(() => entityRegistry.id),
    toId: uuid().notNull().references(() => entityRegistry.id),
    relationId: uuid().notNull().references(() => domainValues.id),
    validFromYear: integer(),
    validToYear: integer(),
    note: text(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.fromId, t.toId, t.relationId).where(live(t.deletedAt)), index().on(t.toId).where(live(t.deletedAt))],
);
