// Organizations with hierarchy, kind/nature, scope and country (doc 19).
import { type AnyPgColumn, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { orgRelationEnum } from '../columns/pg-enum.column';
import { competitionLevels, organizationKinds } from './config.table';
import { countries } from './geography.table';

export const organizations = pgTable(
  'organizations',
  {
    ...baseColumns(),
    slug: text().notNull(),
    name: text().notNull(),
    organizationKindId: uuid().notNull().references(() => organizationKinds.id),
    parentOrganizationId: uuid().references((): AnyPgColumn => organizations.id),
    parentRelation: orgRelationEnum(),
    scopeLevelId: uuid().notNull().references(() => competitionLevels.id),
    countryId: uuid().references(() => countries.id),
    wikidataQid: text(),
    website: text(),
    wikipediaUrl: text(),
    imageUrl: text(),
    shortDescription: text(),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
