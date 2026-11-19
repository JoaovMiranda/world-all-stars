// Editorial sections of a sport page (handoff v3 §10): English base + translations, image with attribution,
// certainty and provenance (field_provenance with entity_type sport_content_sections). Never long text in code.
import { integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { contentSectionStatusEnum } from '../columns/pg-enum.column';
import { domainValues } from './domain.table';
import { mediaLinks } from './source.table';
import { sports } from './sport.table';

export const sportContentSections = pgTable(
  'sport_content_sections',
  {
    ...baseColumns(),
    sportId: uuid().notNull().references(() => sports.id),
    /** overview, history, origin_and_culture, how_it_works, rules, scoring, belts, weight_classes… (varies by sport). */
    sectionKey: text().notNull(),
    sortOrder: integer().notNull().default(0),
    mediaLinkId: uuid().references(() => mediaLinks.id),
    status: contentSectionStatusEnum().notNull().default('draft'),
    certaintyId: uuid().references(() => domainValues.id),
  },
  (t) => [uniqueIndex().on(t.sportId, t.sectionKey).where(live(t.deletedAt))],
);
export const sportContentSectionTranslations = pgTable(
  'sport_content_section_translations',
  { ...baseColumns(), sectionId: uuid().notNull().references(() => sportContentSections.id), locale: text().notNull(), title: text().notNull(), body: text().notNull() },
  (t) => [uniqueIndex().on(t.sectionId, t.locale).where(live(t.deletedAt))],
);
