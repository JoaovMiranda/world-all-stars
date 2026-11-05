// Calendar and geography aspects (doc 03), created on demand (get-or-create) by the writes that use them.
import { integer, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';

/** "02/03" exists once; 1987 and 2013 point to the same day ("Hoje na história" is a lookup by FK). */
export const calendarDays = pgTable(
  'calendar_days',
  { ...baseColumns(), month: integer().notNull(), day: integer().notNull() },
  (t) => [uniqueIndex().on(t.month, t.day).where(live(t.deletedAt))],
);

export const countries = pgTable(
  'countries',
  { ...baseColumns(), iso2: text().notNull(), iso3: text(), /** ISO 3166-1 numeric (world-atlas ids of the globe). */ isoNumeric: text(), flagEmoji: text().notNull(), wikidataQid: text() },
  (t) => [uniqueIndex().on(t.iso2).where(live(t.deletedAt))],
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
