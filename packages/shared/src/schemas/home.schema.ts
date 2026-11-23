import { z } from 'zod';

import { CalendarEventSchema, ObservanceEventSchema } from './calendar-event.schema';
import { GlobeCountrySchema } from './globe-country.schema';
import { HallOfGreatsEntrySchema } from './hall-of-greats.schema';
import { IsoDateSchema } from './iso-date.schema';
import { OnThisDayResponseSchema } from './on-this-day.schema';
import { SportCardSchema } from './sports-tree.schema';

/** Query of GET /api/home. The date comes from the client (its local day), as in GET /api/today. */
export const HomeQuerySchema = z.object({ date: IsoDateSchema });

/** Payload of GET /api/home: everything the home page needs in a single round trip (SSR-friendly). */
export const HomeResponseSchema = z.object({
  date: IsoDateSchema,
  totalAthletes: z.number().int().nonnegative(),
  /** Slugs for "Me surpreenda" (random pick without repeating the last one). */
  athleteSlugs: z.array(z.string().min(1)),
  todayInHistory: OnThisDayResponseSchema.extend({ nextObservance: ObservanceEventSchema.nullable() }),
  /** Next HOME_UPCOMING_DAYS days, sorted by date. */
  upcoming: z.array(CalendarEventSchema),
  /** Events overlapping the calendar window (current year ± 1). */
  calendar: z.array(CalendarEventSchema),
  globe: z.array(GlobeCountrySchema),
  greats: z.array(HallOfGreatsEntrySchema),
  sports: z.array(SportCardSchema),
});
