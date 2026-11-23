// Sport taxonomy as a graph, category dimensions, metrics, extension registry, rulesets, multi-sport programmes,
// representation (communities) and organization roles (handoff v3 §4.2, §4.6–§4.8).
import { type AnyPgColumn, index, integer, jsonb, pgTable, real, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { baseColumns, live } from '../columns/base.column';
import { dimensionValueTypeEnum, metricDirectionEnum, metricValueTypeEnum } from '../columns/pg-enum.column';
import { competitions } from './competition.table';
import { domainValues } from './domain.table';
import { countries } from './geography.table';
import { organizations } from './organization.table';
import { competitors, entityRegistry } from './registry.table';
import { sports } from './sport.table';

/** sport → sport (discipline_of, variant_of, style_of, derived_from, related_to, adapted_from): not a rigid tree. */
export const sportRelations = pgTable(
  'sport_relations',
  {
    ...baseColumns(),
    fromSportId: uuid().notNull().references(() => sports.id),
    toSportId: uuid().notNull().references(() => sports.id),
    relationId: uuid().notNull().references(() => domainValues.id),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.fromSportId, t.toSportId, t.relationId).where(live(t.deletedAt)), index().on(t.toSportId).where(live(t.deletedAt))],
);

/** Descriptive classifications (tradition status, olympic/paralympic status, recognition): never an exclusion rule. */
export const sportClassifications = pgTable(
  'sport_classifications',
  {
    ...baseColumns(),
    sportId: uuid().notNull().references(() => sports.id),
    schemeId: uuid().notNull().references(() => domainValues.id),
    valueId: uuid().notNull().references(() => domainValues.id),
    organizationId: uuid().references(() => organizations.id),
    sinceYear: integer(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.sportId, t.schemeId, t.valueId).where(live(t.deletedAt))],
);

/** A dimension that classifies competition: weight, age, sex_category, distance, style, belt, sport_class… */
export const categoryDimensions = pgTable(
  'category_dimensions',
  { ...baseColumns(), slug: text().notNull(), sportId: uuid().references(() => sports.id), valueType: dimensionValueTypeEnum().notNull(), unitKind: text() },
  (t) => [
    uniqueIndex('category_dimensions_global_uq').on(t.slug).where(sql`${t.deletedAt} is null and ${t.sportId} is null`),
    uniqueIndex('category_dimensions_sport_uq').on(t.slug, t.sportId).where(sql`${t.deletedAt} is null and ${t.sportId} is not null`),
  ],
);
export const categoryDimensionTranslations = pgTable(
  'category_dimension_translations',
  { ...baseColumns(), dimensionId: uuid().notNull().references(() => categoryDimensions.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.dimensionId, t.locale).where(live(t.deletedAt))],
);

/** A value of a dimension, AS THE ORGANIZATION DEFINES IT (original label/unit kept), with validity. */
export const categoryValues = pgTable(
  'category_values',
  {
    ...baseColumns(),
    dimensionId: uuid().notNull().references(() => categoryDimensions.id),
    slug: text().notNull(),
    originalLabel: text().notNull(),
    originalLocale: text(),
    min: real(),
    max: real(),
    unit: text(),
    normalizedMin: real(),
    normalizedMax: real(),
    organizationId: uuid().references(() => organizations.id),
    validFromYear: integer(),
    validToYear: integer(),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [
    uniqueIndex('category_values_global_uq').on(t.dimensionId, t.slug).where(sql`${t.deletedAt} is null and ${t.organizationId} is null`),
    uniqueIndex('category_values_org_uq').on(t.dimensionId, t.slug, t.organizationId).where(sql`${t.deletedAt} is null and ${t.organizationId} is not null`),
  ],
);
export const categoryValueTranslations = pgTable(
  'category_value_translations',
  { ...baseColumns(), valueId: uuid().notNull().references(() => categoryValues.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.valueId, t.locale).where(live(t.deletedAt))],
);

/**
 * A combination used as a division ("IBJJF · black · adult · −76 kg · gi · men"). A set bound to a sport is also a
 * named category of that sport (sport pages, profile categories; replaces sport_categories), optionally nested.
 */
export const categorySets = pgTable(
  'category_sets',
  {
    ...baseColumns(),
    slug: text().notNull(),
    label: text().notNull(),
    sportId: uuid().references(() => sports.id),
    parentSetId: uuid().references((): AnyPgColumn => categorySets.id),
    sortOrder: integer().notNull().default(0),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt)), index().on(t.sportId).where(live(t.deletedAt))],
);
export const categorySetTranslations = pgTable(
  'category_set_translations',
  { ...baseColumns(), setId: uuid().notNull().references(() => categorySets.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.setId, t.locale).where(live(t.deletedAt))],
);
export const categorySetValues = pgTable(
  'category_set_values',
  { ...baseColumns(), setId: uuid().notNull().references(() => categorySets.id), valueId: uuid().notNull().references(() => categoryValues.id) },
  (t) => [uniqueIndex().on(t.setId, t.valueId).where(live(t.deletedAt))],
);

/** Documented equivalence between values of different organizations: NEVER implicit. */
export const categoryMappings = pgTable(
  'category_mappings',
  {
    ...baseColumns(),
    fromValueId: uuid().notNull().references(() => categoryValues.id),
    toValueId: uuid().notNull().references(() => categoryValues.id),
    relationId: uuid().notNull().references(() => domainValues.id),
    contextOrganizationId: uuid().references(() => organizations.id),
    validFromYear: integer(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.fromValueId, t.toValueId, t.relationId).where(live(t.deletedAt))],
);

/** What a result can measure: time, distance, points, rating… (unit + which value is better). */
export const metricDefinitions = pgTable(
  'metric_definitions',
  { ...baseColumns(), slug: text().notNull(), valueType: metricValueTypeEnum().notNull(), unit: text(), better: metricDirectionEnum().notNull().default('none'), sportId: uuid().references(() => sports.id) },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const metricDefinitionTranslations = pgTable(
  'metric_definition_translations',
  { ...baseColumns(), metricId: uuid().notNull().references(() => metricDefinitions.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.metricId, t.locale).where(live(t.deletedAt))],
);

/** Registered typed extensions (`bout.v1`, `chess-game.v1`…): the only JSON a result/stat may carry. */
export const extensionSchemas = pgTable(
  'extension_schemas',
  { ...baseColumns(), key: text().notNull(), sportId: uuid().references(() => sports.id), jsonSchema: jsonb().$type<Record<string, unknown>>().notNull(), description: text() },
  (t) => [uniqueIndex().on(t.key).where(live(t.deletedAt))],
);

/** Version of the rules a competition/event was held under (ruleset-aware history). */
export const competitionRulesets = pgTable(
  'competition_rulesets',
  {
    ...baseColumns(),
    slug: text().notNull(),
    sportId: uuid().references(() => sports.id),
    organizationId: uuid().references(() => organizations.id),
    competitionId: uuid().references(() => competitions.id),
    version: text().notNull(),
    validFromYear: integer(),
    validToYear: integer(),
    documentSourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const competitionRulesetTranslations = pgTable(
  'competition_ruleset_translations',
  { ...baseColumns(), rulesetId: uuid().notNull().references(() => competitionRulesets.id), locale: text().notNull(), summary: text().notNull() },
  (t) => [uniqueIndex().on(t.rulesetId, t.locale).where(live(t.deletedAt))],
);

/** A sport in the programme of a multi-sport event (Olympics, World Games, Commonwealth…), with period (§4.8). */
export const competitionProgramSports = pgTable(
  'competition_program_sports',
  {
    ...baseColumns(),
    competitionId: uuid().notNull().references(() => competitions.id),
    sportId: uuid().notNull().references(() => sports.id),
    inclusionStatusId: uuid().notNull().references(() => domainValues.id),
    firstYear: integer(),
    lastYear: integer(),
    /** Explicit years when the presence was intermittent. */
    editions: integer().array().notNull().default([]),
    note: text(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.competitionId, t.sportId, t.inclusionStatusId).where(live(t.deletedAt)), index().on(t.sportId).where(live(t.deletedAt))],
);

/** Peoples, nations, communities, regions: representation entities that are NOT countries (§4.7). */
export const communities = pgTable(
  'communities',
  { ...baseColumns(), slug: text().notNull(), kindId: uuid().notNull().references(() => domainValues.id), countryId: uuid().references(() => countries.id), parentId: uuid().references((): AnyPgColumn => communities.id) },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const communityTranslations = pgTable(
  'community_translations',
  { ...baseColumns(), communityId: uuid().notNull().references(() => communities.id), locale: text().notNull(), name: text().notNull(), description: text() },
  (t) => [uniqueIndex().on(t.communityId, t.locale).where(live(t.deletedAt))],
);

/** Who/what a competitor represents, in which context and when (replaces athlete_nationalities). Never inferred. */
export const competitorRepresentations = pgTable(
  'competitor_representations',
  {
    ...baseColumns(),
    competitorId: uuid().notNull().references(() => competitors.id),
    representationId: uuid().notNull().references(() => entityRegistry.id),
    contextId: uuid().notNull().references(() => domainValues.id),
    isPrimary: integer().notNull().default(0),
    fromYear: integer(),
    toYear: integer(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.competitorId, t.representationId, t.contextId).where(live(t.deletedAt)), index().on(t.representationId).where(live(t.deletedAt))],
);

/** Organization × entity × role over time (generalizes sport_governing_bodies): governing body, organizer, ratifier… */
export const organizationRoles = pgTable(
  'organization_roles',
  {
    ...baseColumns(),
    organizationId: uuid().notNull().references(() => organizations.id),
    targetId: uuid().notNull().references(() => entityRegistry.id),
    roleId: uuid().notNull().references(() => domainValues.id),
    fromYear: integer(),
    toYear: integer(),
    sourceLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.organizationId, t.targetId, t.roleId).where(live(t.deletedAt)), index().on(t.targetId).where(live(t.deletedAt))],
);
