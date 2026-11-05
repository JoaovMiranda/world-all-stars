// Sport observance days (world/national day of a sport), recurring on a calendar day.
import { pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { baseColumns, live } from '../columns/base.column';
import { observanceRecognitionEnum, observanceScopeEnum } from '../columns/pg-enum.column';
import { calendarDays, countries } from './geography.table';
import { sports } from './sport.table';

export const observanceDays = pgTable(
  'observance_days',
  {
    ...baseColumns(),
    slug: text().notNull(),
    calendarDayId: uuid().notNull().references(() => calendarDays.id),
    scope: observanceScopeEnum().notNull(),
    countryId: uuid().references(() => countries.id),
    sportId: uuid().references(() => sports.id),
    recognition: observanceRecognitionEnum().notNull(),
    reference: text(),
  },
  (t) => [uniqueIndex().on(t.slug).where(live(t.deletedAt))],
);
export const observanceDayTranslations = pgTable(
  'observance_day_translations',
  { ...baseColumns(), observanceDayId: uuid().notNull().references(() => observanceDays.id), locale: text().notNull(), name: text().notNull() },
  (t) => [uniqueIndex().on(t.observanceDayId, t.locale).where(live(t.deletedAt))],
);
