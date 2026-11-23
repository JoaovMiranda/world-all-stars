import type { CalendarEvent } from '../types/calendar-event.type';
import type { GlobeCountry } from '../types/globe-country.type';
import type { HallOfGreatsEntry } from '../types/hall-of-greats.type';
import type { OnThisDayResponse } from '../types/on-this-day.type';
import type { SportCard } from '../types/sports-tree.type';

export interface HomeParts {
  athleteSlugs: readonly string[];
  /** "On this day" fact of the day (null = no fact on that day). */
  onThisDay: OnThisDayResponse | null;
  /** Calendar covering at least [year − 1, year + 1] of the date. */
  calendar: readonly CalendarEvent[];
  globe: GlobeCountry[];
  greats: HallOfGreatsEntry[];
  sports: SportCard[];
}
