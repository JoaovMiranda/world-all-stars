// Calendar and geography aspects (doc 03), created on demand (get-or-create) by the writes that use them.
import { integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { countryKindEnum } from '../columns/pg-enum.column';

/** "02/03" exists once; 1987 and 2013 point to the same day ("Hoje na história" is a lookup by FK). */
export const calendarDays = pgTable(
  'calendar_days',
  { ...baseColumns(), month: integer().notNull(), day: integer().notNull() },
  (t) => [uniqueIndex().on(t.month, t.day).where(live(t.deletedAt))],
);

export const countries = pgTable(
  'countries',
  {
    ...baseColumns(),
    /** Null only for historical/constituent entities (CHECK in migration 0006): USSR, West Germany, England… */
    iso2: text(),
    iso3: text(),
    /** ISO 3166-1 numeric (world-atlas ids of the globe). */
    isoNumeric: text(),
    flagEmoji: text(),
    wikidataQid: text(),
    /** Historical entities are preserved, never converted to their successors (C05). */
    kind: countryKindEnum().notNull().default('sovereign'),
    /** Stable internal key (iso2 for sovereign states, e.g. `urs`, `frg`, `eng` for the others). */
    code: text(),
    iocCode: text(),
    fifaCode: text(),
    validFromYear: integer(),
    validToYear: integer(),
    flagMediaLinkId: uuid(),
  },
  (t) => [uniqueIndex().on(t.iso2).where(live(t.deletedAt)), uniqueIndex('countries_code_uq').on(t.code).where(live(t.deletedAt))],
);
export const countryTranslations = pgTable(
  'country_translations',
  { ...baseColumns(), countryId: uuid().notNull().references(() => countries.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.countryId, t.locale).where(live(t.deletedAt))],
);

export const cities = pgTable('cities', {
  ...baseColumns(),
  countryId: uuid().references(() => countries.id),
  region: text(),
  wikidataQid: text(),
});
export const cityTranslations = pgTable(
  'city_translations',
  { ...baseColumns(), cityId: uuid().notNull().references(() => cities.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.cityId, t.locale).where(live(t.deletedAt))],
);
